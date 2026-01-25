
import { supabase } from './supabase';
import { type Database } from '../types/supabase';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = UserProfile['role'];

export const userService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async updateRole(id: string, role: UserRole) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProfile(id: string, updates: Partial<UserProfile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Note: Creating a user usually involves Auth. 
    // This method only creates the profile record if the Auth user doesn't exist or is handled separately.
    // For a full implementation, we would need a Cloud Function to create the Auth user.
    async createProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
        const { data, error } = await supabase
            .from('profiles')
            .insert(profile)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
