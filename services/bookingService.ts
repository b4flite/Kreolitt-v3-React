import { Booking, BookingStatus, ServiceType, BookingInput, BookingHistoryEntry, CurrencyCode } from '../types';
import { z } from 'zod';
import { supabase } from '../lib/supabaseClient';
import { settingsService } from './settingsService';
import { financeService } from './financeService';
import { emailService } from './emailService';
import { generateUUID } from '../lib/utils';

// Zod Schema for Booking Validation
// Audit Fix: Preprocess amount to convert NaN (empty number input) to undefined for dynamic pricing
export const bookingSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  pickupLocation: z.string().min(3, "Pickup location required"),
  dropoffLocation: z.string().min(3, "Dropoff location required"),
  pickupTime: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Pickup time must be in the future",
  }),
  pax: z.number().min(1, "At least 1 passenger"),
  amount: z.preprocess(
    (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
    z.number().optional()
  ),
  currency: z.string().optional(), // Multi-currency support
  notes: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});

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
  amount: Number(row.amount),
  currency: (row.currency || 'SCR') as CurrencyCode,
  notes: row.notes,
  history: row.history || []
});

const sanitizeInput = (text: string): string => {
  return text.replace(/<[^>]*>?/gm, ''); // Basic strip tags
};

export const bookingService = {
  formatBookingRef: (id: string) => {
    if (!id) return 'REF-ERROR';
    return `KIT-${id.substring(0, 8).toUpperCase()}`;
  },

  syncUserBookings: async (): Promise<void> => {
    const { error } = await supabase.rpc('sync_user_bookings');
    if (error) console.error("Sync bookings failed:", error);
  },

  getBookings: async (page: number = 1, limit: number = 10): Promise<{ data: Booking[], count: number }> => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('pickup_time', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: (data || []).map(mapRowToBooking),
      count: count || 0
    };
  },

  getBookingOptions: async (): Promise<Booking[]> => {
     const { data, error } = await supabase
       .from('bookings')
       .select('id, client_name, amount, status, pickup_time, email, currency')
       .order('pickup_time', { ascending: false });
     
     if(error) throw error;
     return data.map((row: any) => ({
         ...row,
         clientName: row.client_name,
         currency: row.currency || 'SCR',
         clientId: '', 
         serviceType: ServiceType.TRANSFER, 
         pickupLocation: '',
         dropoffLocation: '',
         pickupTime: row.pickup_time,
         pax: 0,
         history: []
     }));
  },

  getBookingStats: async () => {
     const { data, error } = await supabase.from('bookings').select('status');
     if(error) throw error;
     
     const pending = data.filter(b => b.status === BookingStatus.PENDING).length;
     const confirmed = data.filter(b => b.status === BookingStatus.CONFIRMED).length;
     
     return { pending, confirmed };
  },

  getClientBookings: async (clientId: string, email?: string): Promise<Booking[]> => {
    let query = supabase.from('bookings').select('*').order('pickup_time', { ascending: true });

    // Normalize input to prevent whitespace mismatches
    const safeEmail = email ? email.trim() : null;

    if (clientId && safeEmail) {
      // Use ilike for case-insensitive matching on email
      query = query.or(`client_id.eq.${clientId},email.ilike.${safeEmail}`);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    } else if (safeEmail) {
      query = query.ilike('email', safeEmail);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRowToBooking);
  },

  createBooking: async (data: BookingInput, clientId?: string, creatorName?: string): Promise<Booking> => {
    const validated = bookingSchema.parse(data);
    
    // Audit Fix: Dynamic Pricing instead of hardcoded 1200/3000
    let amount = validated.amount;
    if (amount === undefined) {
        const settings = await settingsService.getSettings();
        amount = validated.serviceType === ServiceType.TOUR 
            ? settings.defaultTourPrice 
            : settings.defaultTransferPrice;
    }

    const currency = (validated.currency || 'SCR') as CurrencyCode;
    const newId = generateUUID();
    
    // Normalize email to ensure better matching
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Audit Fix: Sanitize Notes
    const safeNotes = validated.notes ? sanitizeInput(validated.notes) : undefined;

    const initialHistory: BookingHistoryEntry[] = [{
        timestamp: new Date().toISOString(),
        action: 'CREATED',
        details: 'Initial creation',
        user: creatorName || 'System'
    }];

    const safeClientId = (clientId && clientId.length > 20) ? clientId : null;

    const dbPayload = {
        id: newId,
        client_id: safeClientId,
        client_name: validated.clientName,
        email: normalizedEmail,
        phone: validated.phone || null,
        service_type: validated.serviceType,
        pickup_location: validated.pickupLocation,
        dropoff_location: validated.dropoffLocation,
        pickup_time: validated.pickupTime,
        pax: validated.pax,
        status: validated.status || BookingStatus.PENDING,
        amount: amount,
        currency: currency,
        notes: safeNotes,
        history: initialHistory
    };

    const { error } = await supabase.from('bookings').insert(dbPayload);
    if (error) throw error;
    
    const newBooking: Booking = {
        id: newId,
        clientId: safeClientId || 'guest',
        clientName: validated.clientName,
        email: normalizedEmail,
        phone: validated.phone,
        serviceType: validated.serviceType,
        pickupLocation: validated.pickupLocation,
        dropoffLocation: validated.dropoffLocation,
        pickupTime: validated.pickupTime,
        pax: validated.pax,
        status: validated.status || BookingStatus.PENDING,
        amount: amount!,
        currency: currency,
        notes: safeNotes,
        history: initialHistory
    };

    emailService.sendBookingConfirmation(newBooking);
    return newBooking;
  },

  updateStatus: async (id: string, status: BookingStatus, price?: number): Promise<void> => {
    const { data: current } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (!current) throw new Error("Booking not found");

    const updates: any = { 
        status, 
        history: [{
            timestamp: new Date().toISOString(),
            action: 'STATUS_CHANGE',
            user: 'Manager',
            details: `Status changed to ${status}${price ? `. Price set to ${price}` : ''}`,
            previousState: { status: current.status as BookingStatus, amount: current.amount }
        }, ...(current.history || [])]
    };
    if (price !== undefined) updates.amount = price;

    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (error) throw error;

    const updatedBooking = { ...mapRowToBooking(current), status, amount: price ?? current.amount };

    if (status === BookingStatus.CONFIRMED || status === BookingStatus.CANCELLED) {
       emailService.sendBookingStatusUpdate(updatedBooking);
    }

    if (status === BookingStatus.CONFIRMED) {
      try {
        const settings = await settingsService.getSettings();
        if (settings.autoCreateInvoice) {
           await financeService.createInvoiceFromBooking(updatedBooking, settings.vatRate);
        }
      } catch (err) {
        console.error("Auto-invoice generation failed:", err);
      }
    }
  },

  updateBookingDetails: async (id: string, updates: Partial<Booking>): Promise<void> => {
     const { data: current } = await supabase.from('bookings').select('*').eq('id', id).single();
     if (!current) throw new Error("Booking not found");

      const dbUpdates: any = {
          ...(updates.clientName && { client_name: updates.clientName }),
          ...(updates.email && { email: updates.email.toLowerCase().trim() }),
          ...(updates.phone && { phone: updates.phone }),
          ...(updates.serviceType && { service_type: updates.serviceType }),
          ...(updates.pax && { pax: updates.pax }),
          ...(updates.amount && { amount: updates.amount }),
          ...(updates.currency && { currency: updates.currency }),
          ...(updates.pickupTime && { pickup_time: updates.pickupTime }),
          ...(updates.pickupLocation && { pickup_location: updates.pickupLocation }),
          ...(updates.dropoffLocation && { dropoff_location: updates.dropoffLocation }),
          ...(updates.notes && { notes: sanitizeInput(updates.notes || '') }),
      };

      const { error } = await supabase.from('bookings').update(dbUpdates).eq('id', id);
      if (error) throw error;
  },

  deleteBooking: async (id: string): Promise<void> => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if(error) throw error;
  }
};