import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const userService = {
  getAllUsers: async (page: number = 1, limit: number = 50): Promise<{ data: User[], count: number }> => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        address: u.address,
        company: u.company,
        nationality: u.nationality,
        vatNumber: u.vat_number,
        role: u.role as UserRole,
        createdAt: u.created_at
      })),
      count: count || 0
    };
  },

  updateUserRole: async (id: string, role: UserRole): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) throw error;
  },

  updateUserProfile: async (id: string, updates: any): Promise<void> => {
    const dbUpdates: any = {};

    // Specifically allow empty strings to clear fields in DB
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.nationality !== undefined) dbUpdates.nationality = updates.nationality;

    if (updates.vatNumber !== undefined || updates.vat_number !== undefined) {
      dbUpdates.vat_number = updates.vatNumber ?? updates.vat_number;
    }

    // Never allow password in profiles table update
    delete dbUpdates.password;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  }
};