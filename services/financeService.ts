import { Invoice, InvoiceItem, Booking, Expense, ExpenseCategory, SEYCHELLES_BUSINESS_TAX_THRESHOLD, SEYCHELLES_BUSINESS_TAX_RATE, SEYCHELLES_VAT_RATE_DEFAULT, CurrencyCode } from '../types';
import { supabase } from '../lib/supabaseClient';
import { generateUUID } from '../lib/utils';
import { emailService } from './emailService';
import { settingsService } from './settingsService';

const mapRowToInvoice = (row: any): Invoice => {
  let items: InvoiceItem[] = Array.isArray(row.items) ? row.items.map((i: any) => ({
      id: i.id,
      description: i.description,
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      total: Number(i.total) || 0
  })) : [];
  
  if (items.length === 0 && row.total > 0) {
      items = [{
          id: generateUUID(),
          description: row.booking_id ? 'Transport Service' : 'General Service',
          quantity: 1,
          unitPrice: Number(row.total) || 0,
          total: Number(row.total) || 0
      }];
  }

  return {
    id: row.id,
    bookingId: row.booking_id,
    clientName: row.client_name,
    date: row.date,
    subtotal: Number(row.subtotal) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    total: Number(row.total) || 0,
    paid: row.paid,
    currency: (row.currency || 'SCR') as CurrencyCode,
    items: items
  };
};

const mapRowToExpense = (row: any): Expense => ({
  id: row.id,
  date: row.date,
  category: row.category as ExpenseCategory,
  description: row.description,
  amount: Number(row.amount) || 0,
  currency: (row.currency || 'SCR') as CurrencyCode,
  vatIncluded: row.vat_included,
  vatAmount: Number(row.vat_amount) || 0,
  reference: row.reference,
  bookingId: row.booking_id
});

// --- Math Helpers ---
const toCents = (val: number) => Math.round(val * 100);
const fromCents = (cents: number) => cents / 100;

const calculateInputTax = (amount: number, isVatInclusive: boolean, vatRate: number = SEYCHELLES_VAT_RATE_DEFAULT): number => {
    if (!isVatInclusive) return 0;
    const totalCents = toCents(amount);
    const subtotalCents = Math.round(totalCents / (1 + vatRate));
    const vatCents = totalCents - subtotalCents;
    return fromCents(vatCents);
};

interface AddExpenseOptions {
    addToInvoice?: boolean;
}

export const financeService = {
  calculateTotals: (totalAmount: number, vatRate: number = SEYCHELLES_VAT_RATE_DEFAULT) => {
      const safeTotal = isNaN(Number(totalAmount)) ? 0 : Number(totalAmount);
      const safeRate = isNaN(Number(vatRate)) ? SEYCHELLES_VAT_RATE_DEFAULT : Number(vatRate);

      const totalCents = toCents(safeTotal);
      const subtotalCents = Math.round(totalCents / (1 + safeRate));
      const taxCents = totalCents - subtotalCents;

      return {
          subtotal: fromCents(subtotalCents),
          taxAmount: fromCents(taxCents),
          total: fromCents(totalCents)
      };
  },

  getInvoices: async (page: number = 1, limit: number = 10): Promise<{ data: Invoice[], count: number }> => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);
    
    if(error) throw error;
    return {
        data: (data || []).map(mapRowToInvoice),
        count: count || 0
    };
  },

  getClientInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    
    if(error) throw error;
    return (data || []).map(mapRowToInvoice);
  },

  getInvoiceByBookingId: async (bookingId: string): Promise<Invoice | undefined> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; 
    return data ? mapRowToInvoice(data) : undefined;
  },

  createInvoice: async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const dbPayload = {
        booking_id: invoiceData.bookingId,
        client_name: invoiceData.clientName,
        date: invoiceData.date,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total: invoiceData.total,
        paid: !!invoiceData.paid,
        currency: invoiceData.currency || 'SCR',
        items: invoiceData.items || []
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert(dbPayload)
        .select()
        .single();

    if(error) throw error;
    const newInvoice = mapRowToInvoice(data);

    if (newInvoice.bookingId) {
       try {
         const { data: bookingData } = await supabase.from('bookings').select('email').eq('id', newInvoice.bookingId).single();
         if (bookingData?.email) {
            emailService.sendInvoice(newInvoice, bookingData.email);
         }
       } catch (err) {
         console.error("Failed to fetch email for invoice sending", err);
       }
    }

    return newInvoice;
  },

  createInvoiceFromBooking: async (booking: Booking, vatRate: number = SEYCHELLES_VAT_RATE_DEFAULT): Promise<Invoice> => {
    const existing = await financeService.getInvoiceByBookingId(booking.id);
    if(existing) return existing;

    const total = booking.amount || 0;
    const { subtotal, taxAmount } = financeService.calculateTotals(total, vatRate);
    
    const items: InvoiceItem[] = [{
        id: generateUUID(),
        description: `${booking.serviceType} - ${booking.pickupLocation} to ${booking.dropoffLocation}`,
        quantity: 1,
        unitPrice: total,
        total: total
    }];

    return financeService.createInvoice({
      bookingId: booking.id,
      clientName: booking.clientName,
      date: new Date().toISOString(),
      subtotal,
      taxAmount,
      total,
      paid: false,
      currency: booking.currency || 'SCR',
      items: items
    } as any);
  },

  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const dbUpdates: any = {};
    if(updates.clientName) dbUpdates.client_name = updates.clientName;
    if(updates.date) dbUpdates.date = updates.date;
    if(updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
    if(updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount;
    if(updates.total !== undefined) dbUpdates.total = updates.total;
    if(updates.paid !== undefined) dbUpdates.paid = updates.paid;
    if(updates.currency) dbUpdates.currency = updates.currency;
    if(updates.items) dbUpdates.items = updates.items;

    const { data, error } = await supabase.from('invoices').update(dbUpdates).eq('id', id).select().single();
    if(error) throw error;
    return mapRowToInvoice(data);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if(error) throw error;
  },

  toggleInvoiceStatus: async (id: string): Promise<Invoice> => {
    const { data: current, error: fetchError } = await supabase.from('invoices').select('paid').eq('id', id).single();
    if(fetchError) throw fetchError;

    const { data, error } = await supabase.from('invoices').update({ paid: !current.paid }).eq('id', id).select().single();
    if(error) throw error;
    return mapRowToInvoice(data);
  },

  getAllExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if(error) throw error;
    return data.map(mapRowToExpense);
  },

  addExpense: async (expense: Omit<Expense, 'id' | 'vatAmount'>, vatRate: number = SEYCHELLES_VAT_RATE_DEFAULT, options?: AddExpenseOptions): Promise<Expense> => {
    const vatAmount = calculateInputTax(expense.amount, expense.vatIncluded, vatRate);

    const dbPayload = {
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency || 'SCR',
        vat_included: expense.vatIncluded,
        vat_amount: vatAmount,
        booking_id: expense.bookingId || null,
        reference: expense.reference
    };

    const { data, error } = await supabase.from('expenses').insert(dbPayload).select().single();
    if(error) throw error;

    if (options?.addToInvoice && expense.bookingId) {
        const existingInvoice = await financeService.getInvoiceByBookingId(expense.bookingId);
        if (existingInvoice) {
            const newItem: InvoiceItem = {
                id: generateUUID(),
                description: `Expense Re-bill: ${expense.description}`,
                quantity: 1,
                unitPrice: expense.amount,
                total: expense.amount
            };
            
            const newItems = [...(existingInvoice.items || []), newItem];
            const newTotal = existingInvoice.items.reduce((acc, i) => acc + i.total, 0) + expense.amount;
            const { subtotal, taxAmount } = financeService.calculateTotals(newTotal, vatRate);
            
            await financeService.updateInvoice(existingInvoice.id, {
                items: newItems,
                subtotal,
                taxAmount,
                total: newTotal
            });
        }
    }

    return mapRowToExpense(data);
  },

  updateExpense: async (id: string, updates: Partial<Expense>, vatRate: number = SEYCHELLES_VAT_RATE_DEFAULT): Promise<Expense> => {
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if(error) throw error;
    return mapRowToExpense(data);
  },

  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if(error) throw error;
  },

  getStats: async () => {
    // Fetch dynamic exchange rates from settings
    const settings = await settingsService.getSettings();
    const rates: Record<CurrencyCode, number> = {
        SCR: 1,
        EUR: settings.eurRate || 15.2,
        USD: settings.usdRate || 14.1
    };

    const { data: invoices } = await supabase.from('invoices').select('total, tax_amount, paid, currency');
    const { data: expenses } = await supabase.from('expenses').select('amount, vat_amount, currency');

    const invs = invoices || [];
    const exps = expenses || [];

    const convertToBase = (amount: number, currency: string): number => {
        const code = (currency || 'SCR') as CurrencyCode;
        return amount * (rates[code] || 1);
    };

    // Aggregate in SCR (Base Currency) using dynamic rates
    const totalRevenue = invs.reduce((acc, curr) => acc + convertToBase(curr.total, curr.currency), 0);
    const totalOutputTax = invs.reduce((acc, curr) => acc + convertToBase(curr.tax_amount, curr.currency), 0);
    const totalExpenses = exps.reduce((acc, curr) => acc + convertToBase(curr.amount, curr.currency), 0);
    const totalInputTax = exps.reduce((acc, curr) => acc + convertToBase(curr.vat_amount, curr.currency), 0);
    
    const netProfit = (totalRevenue - totalOutputTax) - (totalExpenses - totalInputTax);
    const vatPayable = totalOutputTax - totalInputTax;

    return {
      totalRevenue,
      totalOutputTax, 
      totalExpenses,
      totalInputTax, 
      vatPayable, 
      netProfit,
      pendingInvoices: invs.filter(i => !i.paid).length
    };
  }
};