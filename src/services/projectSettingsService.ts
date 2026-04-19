import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type ProjectSettingsRow = Database['public']['Tables']['project_settings']['Row'];

export const projectSettingsService = {
    async getSettings(projectName: string, activeClientId?: string | null): Promise<ProjectSettingsRow | null> {
        let query = supabase
            .from('project_settings')
            .select('*')
            .eq('project_name', projectName);
            
        if (activeClientId) {
            query = query.eq('cliente_id', activeClientId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('Error fetching project settings:', error);
            throw error;
        }

        return data;
    },

    async upsertSettings(projectName: string, clientListId: string | null, supplierListId: string | null, activeClientId?: string | null): Promise<void> {
        const { error } = await supabase
            .from('project_settings')
            .upsert(
                {
                    project_name: projectName,
                    client_price_list_id: clientListId,
                    supplier_price_list_id: supplierListId,
                    cliente_id: activeClientId || null,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'project_name' }
            );

        if (error) {
            console.error('Error upserting project settings:', error);
            throw error;
        }
    }
};
