import { supabase } from './supabase';
import { type Database } from '../types/supabase';

export type PianificazioneInsert = Database['public']['Tables']['pianificazioni']['Insert'];

export const pianificazioneService = {
    // Bulk Import for Excel
    async createBulk(pianificazioni: PianificazioneInsert[]) {
        if (!pianificazioni.length) return { data: [], error: null };

        // 1. Fetch existing dates to determine if it's a new date (insert) or existing (update/upsert)
        const woIds = Array.from(new Set(pianificazioni.map(p => p.work_order_id)));
        const { data: existingPlans, error: fetchErr } = await supabase
            .from('pianificazioni')
            .select('work_order_id, data_pianificazione')
            .in('work_order_id', woIds);

        if (fetchErr) return { data: null, error: fetchErr };

        // Map existing WO to their known dates (ignoring time)
        const existingDatesMap = new Map<string, string[]>();
        existingPlans?.forEach(ep => {
            if (ep.data_pianificazione) {
                const dateOnly = ep.data_pianificazione.split('T')[0];
                const dates = existingDatesMap.get(ep.work_order_id) || [];
                dates.push(dateOnly);
                existingDatesMap.set(ep.work_order_id, dates);
            }
        });

        // 2. Upsert Pianificazioni
        const { data, error } = await supabase
            .from('pianificazioni')
            // Using a conflict target requires a UNIQUE constraint. 
            // We added one on (work_order_id, data_pianificazione).
            // BUT Postgres complains if data_pianificazione is null in conflicts.
            // Let's rely on standard insert for null dates, and upsert for non-null dates.
            // For simplicity and since data_pianificazione might be null, we must filter.
            .upsert(
                pianificazioni.filter(p => p.data_pianificazione !== null),
                { onConflict: 'work_order_id, data_pianificazione' }
            )
            .select();

        let nullDateInsertErr = null;
        const nullDatePlans = pianificazioni.filter(p => !p.data_pianificazione);
        if (nullDatePlans.length > 0) {
            const res = await supabase.from('pianificazioni').insert(nullDatePlans);
            nullDateInsertErr = res.error;
        }

        if (error || nullDateInsertErr) return { data: null, error: error || nullDateInsertErr };

        // 3. Update parent Work Orders status based on rules
        // Rules:
        // - if data_pianificazione is empty -> "Da Pianificare"
        // - if data_pianificazione coincides with existing -> no change to status (we skip updating it)
        // - if data_pianificazione is new -> "Pianificato"
        // - if esito == 'NON OK' -> "Da Ripianificare"
        // - if esito == 'OK' -> "Completato"

        for (const p of pianificazioni) {
            let nextStatus: string | null = null;

            if (p.esito === 'OK') {
                nextStatus = 'Completato';
            } else if (p.esito === 'NON OK') {
                nextStatus = 'Da Ripianificare';
            } else if (!p.data_pianificazione) {
                nextStatus = 'Da Pianificare';
            } else {
                // It has a date and no definitive negative/positive outcome
                const dateOnly = p.data_pianificazione.split('T')[0];
                const knownDatesForWo = existingDatesMap.get(p.work_order_id) || [];
                const isExistingDate = knownDatesForWo.includes(dateOnly);

                if (!isExistingDate) {
                    // New date => Transition to Pianificato
                    nextStatus = 'Pianificato';
                }
                // If it IS an existing date, nextStatus remains null -> meaning we do NOT update 'gestione'
            }

            if (nextStatus) {
                const { error: woUpdateErr } = await supabase
                    .from('work_orders')
                    .update({ gestione: nextStatus })
                    .eq('work_order', p.work_order_id);

                if (woUpdateErr) {
                    console.error(`Failed to update WO ${p.work_order_id} to status ${nextStatus}:`, woUpdateErr);
                }
            }
        }

        return { data: (data || []).concat(nullDatePlans as any), error: null };
    },

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
                    work_order,
                    progetto,
                    gestione
                )
            `)
            .gte('data_pianificazione', start.toISOString())
            .lte('data_pianificazione', end.toISOString());

        if (error) throw error;

        // processing for aggregation
        return data;
    },

    // Get all planning for a specific month
    async getMonthPlan(year: number, month: number) {
        // month is 0-indexed (0 = Jan, 11 = Dec)
        const start = new Date(year, month, 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(year, month + 1, 0);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('pianificazioni')
            .select(`
                data_pianificazione,
                esito,
                work_orders (
                    work_order,
                    progetto,
                    gestione
                )
            `)
            .gte('data_pianificazione', start.toISOString())
            .lte('data_pianificazione', end.toISOString())
            .order('data_pianificazione', { ascending: true });

        if (error) throw error;

        return data;
    }
};
