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
    // Audit Fix: Never send 'password' to the profiles table (it belongs in auth.users)
    // and filter for known columns to prevent "column does not exist" errors
    const allowedColumns = ['name', 'phone', 'address', 'company', 'nationality', 'vat_number'];

    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.address) dbUpdates.address = updates.address;
    if (updates.company) dbUpdates.company = updates.company;
    if (updates.nationality) dbUpdates.nationality = updates.nationality;
    if (updates.vatNumber || updates.vat_number) {
      dbUpdates.vat_number = updates.vatNumber || updates.vat_number;
    }

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  }
};