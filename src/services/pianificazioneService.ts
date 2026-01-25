import { supabase } from './supabase';

export const pianificazioneService = {
    // Get planning for a specific date range
    async getDailyPlan(date: Date) {
        // Format date as YYYY-MM-DD for comparison (assuming data_pianificazione is timestamptz, we need to be careful with timezones or just match the day)
        // Since the user talks about "today", "tomorrow", usually we want everything that falls within that day.

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        console.log('[DailyPlan] Fetching for:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

        const { data, error } = await supabase
            .from('pianificazioni')
            .select(`
                *,
                work_orders (
                    *
                ),
                fornitori (
                    ragione_sociale
                )
            `)
            .gte('data_pianificazione', startOfDay.toISOString())
            .lte('data_pianificazione', endOfDay.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[DailyPlan] Error:', error);
            throw error;
        }

        console.log('[DailyPlan] Result:', data);
        return data;
    },

    // Update outcome
    async updateOutcome(id: string, esito: 'IN CORSO' | 'OK' | 'NON OK' | null, motivazione?: string) {
        const updateData: any = { esito };
        if (motivazione !== undefined) {
            updateData.motivazione_fallimento = motivazione;
        }

        const { data, error } = await supabase
            .from('pianificazioni')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get summary for next 5 days
    async getNextDaysSummary() {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() + 1); // Start from tomorrow
        start.setHours(0, 0, 0, 0);

        const end = new Date(today);
        end.setDate(today.getDate() + 5);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('pianificazioni')
            .select(`
                data_pianificazione,
                work_orders (
                    progetto
                )
            `)
            .gte('data_pianificazione', start.toISOString())
            .lte('data_pianificazione', end.toISOString());

        if (error) throw error;

        // processing for aggregation
        return data;
    }
};
