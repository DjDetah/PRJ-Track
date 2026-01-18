import { supabase } from './supabase';
import { type Database } from '../types/supabase';

export type Fornitore = Database['public']['Tables']['fornitori']['Row'];

export const supplierService = {
    async getAll() {
        const { data, error } = await supabase
            .from('fornitori')
            .select('*')
            .eq('stato', 'Attivo') // Fetch only active suppliers for selection
            .order('ragione_sociale');

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('fornitori')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
};
