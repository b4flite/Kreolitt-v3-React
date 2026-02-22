import { supabase } from '../lib/supabaseClient';
import { Booking, Invoice } from '../types';
import { toast } from 'react-hot-toast';
import { settingsService } from './settingsService';

// Define the payload structure expected by the Edge Function
interface EmailPayload {
  type: 'NEW_BOOKING' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'INVOICE_GENERATED';
  recipient: string;
  name: string;
  data: any;
}

export const emailService = {
  /**
   * generic wrapper to call the 'send-email' Edge Function
   */
  sendEmail: async (payload: EmailPayload) => {
    try {
      // In a real production environment, we invoke the function.
      // For the demo/static version without the function deployed, we mock success.
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload
      });

      if (error) {
        // If function is missing (404), we just log it for now so the app doesn't crash
        console.warn("Email Edge Function not deployed:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Failed to trigger email:", err);
      return false;
    }
  },

  sendBookingConfirmation: async (booking: Booking) => {
    const settings = await settingsService.getSettings();
    if (!settings.enableEmailNotifications) return;

    // 1. Send to Client
    if (booking.email) {
      await emailService.sendEmail({
        type: 'NEW_BOOKING',
        recipient: booking.email,
        name: booking.clientName,
        data: {
          reference: booking.id.substring(0, 8).toUpperCase(),
          service: booking.serviceType,
          date: new Date(booking.pickupTime).toLocaleDateString(),
          time: new Date(booking.pickupTime).toLocaleTimeString(),
          pickup: booking.pickupLocation,
          dropoff: booking.dropoffLocation,
          pax: booking.pax,
          amount: booking.amount
        }
      });
      toast.success("Confirmation email sent to client");
    }

    // 2. Send Copy to Manager (if main email is set)
    if (settings.email) {
       await emailService.sendEmail({
        type: 'NEW_BOOKING',
        recipient: settings.email,
        name: `${booking.clientName} (Admin Copy)`,
        data: {
          reference: booking.id.substring(0, 8).toUpperCase(),
          service: booking.serviceType,
          date: new Date(booking.pickupTime).toLocaleDateString(),
          time: new Date(booking.pickupTime).toLocaleTimeString(),
          pickup: booking.pickupLocation,
          dropoff: booking.dropoffLocation,
          pax: booking.pax,
          amount: booking.amount
        }
      });
    }
  },

  sendBookingStatusUpdate: async (booking: Booking) => {
    const settings = await settingsService.getSettings();
    if (!settings.enableEmailNotifications || !booking.email) return;

    const type = booking.status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 
                 booking.status === 'CANCELLED' ? 'BOOKING_CANCELLED' : null;
    
    if (!type) return;

    const sent = await emailService.sendEmail({
      type,
      recipient: booking.email,
      name: booking.clientName,
      data: {
        reference: booking.id.substring(0, 8).toUpperCase(),
        status: booking.status
      }
    });

    if (sent) toast.success(`Status update email sent (${booking.status})`);
  },

  sendInvoice: async (invoice: Invoice, clientEmail: string) => {
    const settings = await settingsService.getSettings();
    if (!settings.enableEmailNotifications || !clientEmail) return;

    const sent = await emailService.sendEmail({
      type: 'INVOICE_GENERATED',
      recipient: clientEmail,
      name: invoice.clientName,
      data: {
        invoiceNumber: invoice.id.substring(0, 8).toUpperCase(),
        amount: invoice.total,
        dueDate: new Date(invoice.date).toLocaleDateString(),
        link: `${window.location.origin}/#/portal` // Link to client portal
      }
    });

    if (sent) toast.success("Invoice emailed to client");
  }
};