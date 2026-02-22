import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface BackupData {
  version: string;
  timestamp: string;
  tables: {
    business_settings: any[];
    profiles: any[];
    bookings: any[];
    invoices: any[];
    expenses: any[];
    adverts: any[];
    gallery: any[];
    services: any[];
  };
}

export const backupService = {
  /**
   * Fetches all data from the database and triggers a JSON download.
   */
  createBackup: async () => {
    try {
      const timestamp = new Date().toISOString();
      
      // Fetch data in parallel
      const [
        { data: settings },
        { data: profiles },
        { data: bookings },
        { data: invoices },
        { data: expenses },
        { data: adverts },
        { data: gallery },
        { data: services }
      ] = await Promise.all([
        supabase.from('business_settings').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('adverts').select('*'),
        supabase.from('gallery').select('*'),
        supabase.from('services').select('*')
      ]);

      const backupData: BackupData = {
        version: "1.1",
        timestamp,
        tables: {
          business_settings: settings || [],
          profiles: profiles || [],
          bookings: bookings || [],
          invoices: invoices || [],
          expenses: expenses || [],
          adverts: adverts || [],
          gallery: gallery || [],
          services: services || []
        }
      };

      // Create Blob and download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kreol_backup_${timestamp.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error("Backup failed", error);
      throw error;
    }
  },

  /**
   * Reads a JSON file and upserts data into Supabase tables in dependency order.
   * Handles Foreign Key constraints by checking existence of parent records.
   */
  restoreBackup: async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          if (!event.target?.result) throw new Error("File is empty");
          
          const json = JSON.parse(event.target.result as string) as BackupData;
          
          if (!json.tables || !json.version) {
            throw new Error("Invalid backup file format");
          }

          // 1. Restore Independent Tables (Settings, Adverts, Gallery, Services)
          const independentTables = [
            { table: 'business_settings', data: json.tables.business_settings },
            { table: 'adverts', data: json.tables.adverts },
            { table: 'gallery', data: json.tables.gallery },
            { table: 'services', data: json.tables.services }
          ];

          for (const item of independentTables) {
            if (item.data?.length) {
                await supabase.from(item.table).upsert(item.data);
            }
          }

          // 2. Restore Profiles
          // Note: This often fails partially if 'auth.users' entries are missing in the new environment.
          // We attempt it, but ignore errors so we can proceed with bookings.
          let validProfileIds: Set<string> = new Set();
          
          if (json.tables.profiles?.length) {
            const { error } = await supabase.from('profiles').upsert(json.tables.profiles);
            if (error) {
              console.warn("Profiles restore partial fail (likely missing Auth users):", error.message);
            }
            
            // Fetch valid profiles that actually exist in DB now
            const { data: existingProfiles } = await supabase.from('profiles').select('id');
            if (existingProfiles) {
               existingProfiles.forEach(p => validProfileIds.add(p.id));
            }
          }

          // 3. Restore Bookings (Depends on Profiles)
          if (json.tables.bookings?.length) {
            // Sanitize Bookings: If client_id points to a profile that doesn't exist, set it to NULL.
            // This prevents Foreign Key constraint violations during restore.
            const sanitizedBookings = json.tables.bookings.map((booking: any) => {
                if (booking.client_id && !validProfileIds.has(booking.client_id)) {
                    // Detach from missing profile, convert to "Guest" booking
                    return { ...booking, client_id: null };
                }
                return booking;
            });

            const { error: bookingError } = await supabase.from('bookings').upsert(sanitizedBookings);
            if (bookingError) throw bookingError;
          }

          // 4. Restore Finances (Depends on Bookings)
          if (json.tables.invoices?.length) {
            const { error } = await supabase.from('invoices').upsert(json.tables.invoices);
            if (error) throw error;
          }

          if (json.tables.expenses?.length) {
            const { error } = await supabase.from('expenses').upsert(json.tables.expenses);
            if (error) throw error;
          }

          resolve(true);
        } catch (error) {
          console.error("Restore failed", error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
};