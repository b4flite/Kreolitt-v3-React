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

  updateUserProfile: async (id: string, updates: {
    name?: string;
    phone?: string;
    address?: string;
    company?: string;
    nationality?: string;
    vatNumber?: string;
  }): Promise<void> => {
    // Map vatNumber to vat_number for DB
    const dbUpdates: any = { ...updates };
    if (updates.vatNumber) {
      dbUpdates.vat_number = updates.vatNumber;
      delete dbUpdates.vatNumber;
    }

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  }
};