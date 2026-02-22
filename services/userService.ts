import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Map DB Profile to User Type
    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role as UserRole,
      createdAt: u.created_at
    }));
  },

  updateUserRole: async (id: string, role: UserRole): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);
      
    if (error) throw error;
  },

  updateUserProfile: async (id: string, updates: { name?: string; phone?: string }): Promise<void> => {
     const { error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('id', id);

     if (error) throw error;
  }
};