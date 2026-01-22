import { supabase } from './supabase';
import { type Database } from '../types/supabase';

export type FailureReason = Database['public']['Tables']['planning_failure_reasons']['Row'];

export const settingsService = {
    // Get all active reasons (for Dropdowns)
    async getActiveFailureReasons() {
        const { data, error } = await supabase
            .from('planning_failure_reasons')
            .select('*')
            .eq('is_active', true)
            .order('reason', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get ALL reasons (for Settings Page)
    async getAllFailureReasons() {
        const { data, error } = await supabase
            .from('planning_failure_reasons')
            .select('*')
            .order('reason', { ascending: true });

        if (error) throw error;
        return data;
    },

    async addFailureReason(reason: string) {
        const { data, error } = await supabase
            .from('planning_failure_reasons')
            .insert({ reason })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleFailureReason(id: string, currentState: boolean) {
        const { data, error } = await supabase
            .from('planning_failure_reasons')
            .update({ is_active: !currentState })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteFailureReason(id: string) {
        const { error } = await supabase
            .from('planning_failure_reasons')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
