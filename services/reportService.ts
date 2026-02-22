
import { supabase } from '../lib/supabaseClient';
import { Booking, BookingStatus, ServiceType, Invoice, Expense, ExpenseCategory, CurrencyCode } from '../types';

// Helper mappers (keeping logic consistent with other services)
// Added missing currency and phone properties to match Booking type definition
const mapRowToBooking = (row: any): Booking => ({
  id: row.id,
  clientId: row.client_id || 'guest',
  clientName: row.client_name,
  email: row.email,
  phone: row.phone,
  serviceType: row.service_type as ServiceType,
  pickupLocation: row.pickup_location,
  dropoffLocation: row.dropoff_location,
  pickupTime: row.pickup_time,
  pax: row.pax,
  status: row.status as BookingStatus,
  amount: row.amount,
  currency: (row.currency || 'SCR') as CurrencyCode,
  notes: row.notes,
  history: row.history || []
});

const mapRowToInvoice = (row: any): Invoice => ({
    id: row.id,
    bookingId: row.booking_id,
    clientName: row.client_name,
    date: row.date,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    total: row.total,
    paid: row.paid,
    currency: row.currency,
    items: row.items || []
});

// Added missing currency property to match Expense type definition
const mapRowToExpense = (row: any): Expense => ({
    id: row.id,
    date: row.date,
    category: row.category as ExpenseCategory,
    description: row.description,
    amount: row.amount,
    currency: (row.currency || 'SCR') as CurrencyCode,
    vatIncluded: row.vat_included,
    vatAmount: row.vat_amount,
    reference: row.reference,
    bookingId: row.booking_id
});

export const reportService = {
  /**
   * Fetches all non-cancelled bookings within a date range for operational planning.
   */
  getManifest: async (startDate: string, endDate: string): Promise<Booking[]> => {
    // Ensure we cover the full end day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('pickup_time', new Date(startDate).toISOString())
      .lte('pickup_time', end.toISOString())
      .neq('status', 'CANCELLED')
      .order('pickup_time', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapRowToBooking);
  },

  /**
   * Fetches financial data (Invoices & Expenses) for a specific period.
   */
  getFinancialReport: async (startDate: string, endDate: string) => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const startIso = new Date(startDate).toISOString();
    const endIso = end.toISOString();

    const [invoicesRes, expensesRes] = await Promise.all([
        supabase.from('invoices').select('*').gte('date', startIso).lte('date', endIso),
        supabase.from('expenses').select('*').gte('date', startIso).lte('date', endIso)
    ]);

    if (invoicesRes.error) throw invoicesRes.error;
    if (expensesRes.error) throw expensesRes.error;

    const invoices = (invoicesRes.data || []).map(mapRowToInvoice);
    const expenses = (expensesRes.data || []).map(mapRowToExpense);

    // Calculations
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaidRevenue = invoices.filter(i => i.paid).reduce((sum, inv) => sum + inv.total, 0);
    const totalPendingRevenue = totalRevenue - totalPaidRevenue;
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Group Revenue by Service Type (derived from Booking ID if linked, simplistic approach otherwise)
    // Note: In a real app, we'd join bookings table. For now, we aggregate totals.
    
    const netProfit = totalRevenue - totalExpenses;

    return {
        invoices,
        expenses,
        summary: {
            totalRevenue,
            totalPaidRevenue,
            totalPendingRevenue,
            totalExpenses,
            netProfit
        }
    };
  }
};
