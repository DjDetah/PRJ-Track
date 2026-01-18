import { supabase } from './supabase';
import { type Database } from '../types/supabase';
import { priceListService } from './priceListService';

export type WorkOrder = Database['public']['Tables']['work_orders']['Row'] & {
    pianificazioni?: { data_pianificazione: string }[];
};
export type WorkOrderInsert = Database['public']['Tables']['work_orders']['Insert'];
export type WorkOrderUpdate = Database['public']['Tables']['work_orders']['Update'];

export const workOrderService = {
    // Fetch all work orders (filtered by RLS automatically)
    async getAll() {
        const { data, error } = await supabase
            .from('work_orders')
            .select('*, pianificazioni(data_pianificazione)')
            .order('system_created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get a single work order by ID (PK)
    async getById(id: string) {
        const { data, error } = await supabase
            .from('work_orders')
            .select('*')
            .eq('work_order', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create a new work order
    async create(workOrder: WorkOrderInsert) {
        // Auto-assign default listino if not provided
        if (!workOrder.price_list_id) {
            const defaultListino = await priceListService.getDefault('Consuntivo');
            if (defaultListino) {
                workOrder.price_list_id = defaultListino.id || null;
            }
        }

        const { data, error } = await supabase
            .from('work_orders')
            .insert(workOrder)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create multiple work orders (Bulk Import)
    async createBulk(workOrders: WorkOrderInsert[]) {
        // Fetch default listino once for efficiency
        let defaultListinoId: string | null = null;
        try {
            const defaultListino = await priceListService.getDefault('Consuntivo');
            if (defaultListino) {
                defaultListinoId = defaultListino.id;
            }
        } catch (e) {
            console.warn('Could not fetch default listino for bulk import', e);
        }

        // Assign to all items that don't have one
        const enrichedWorkOrders = workOrders.map(wo => ({
            ...wo,
            price_list_id: wo.price_list_id ?? defaultListinoId
        }));

        // Supabase allows bulk insert by passing an array
        const { data, error } = await supabase
            .from('work_orders')
            .insert(enrichedWorkOrders)
            .select();

        return { data, error };
    },

    // Update an existing work order
    async update(id: string, updates: WorkOrderUpdate) {
        const { data, error } = await supabase
            .from('work_orders')
            .update(updates)
            .eq('work_order', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    // PIANIFICAZIONI METHODS
    async getPianificazioni(workOrderId: string) {
        const { data, error } = await supabase
            .from('pianificazioni')
            .select('*, fornitori(ragione_sociale)')
            .eq('work_order_id', workOrderId)
            .order('data_pianificazione', { ascending: true }); // chronological order

        if (error) throw error;
        return data;
    },

    async addPianificazione(planning: {
        workOrderId: string;
        date: string;
        noteImportanti?: string;
        noteChiusura?: string;
        fornitoreId?: string;
        priceListId?: string; // New field
    }) {
        const { data, error } = await supabase
            .from('pianificazioni')
            .insert({
                work_order_id: planning.workOrderId,
                data_pianificazione: planning.date,
                note_importanti: planning.noteImportanti,
                note_chiusura: planning.noteChiusura,
                fornitore_id: planning.fornitoreId,
                price_list_id: planning.priceListId // New field
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePianificazione(id: string, updates: {
        date?: string;
        noteImportanti?: string;
        noteChiusura?: string;
        fornitoreId?: string;
        priceListId?: string; // New field
    }) {
        const { data, error } = await supabase
            .from('pianificazioni')
            .update({
                data_pianificazione: updates.date,
                note_importanti: updates.noteImportanti,
                note_chiusura: updates.noteChiusura,
                fornitore_id: updates.fornitoreId ?? null,
                price_list_id: updates.priceListId ?? null // New field
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deletePianificazione(id: string) {
        const { error } = await supabase
            .from('pianificazioni')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getProjectStats() {
        const { data, error } = await supabase
            .from('work_orders')
            .select('progetto, stato');

        if (error) throw error;

        // Client-side aggregation
        const statsMap = new Map<string, { total: number; closed: number; open: number }>();
        const closedStatuses = ['Closed', 'Completed', 'Chiuso', 'Completato', 'Terminato', 'chiuso completato'];

        data.forEach(row => {
            const project = row.progetto || 'Senza Progetto';
            if (!statsMap.has(project)) {
                statsMap.set(project, { total: 0, closed: 0, open: 0 });
            }

            const stat = statsMap.get(project)!;
            stat.total++;

            const isClosed = closedStatuses.some(s => s.toLowerCase() === row.stato?.toLowerCase());
            if (isClosed) {
                stat.closed++;
            } else {
                stat.open++;
            }
        });

        return Array.from(statsMap.entries()).map(([name, stats]) => ({
            name,
            ...stats
        })).sort((a, b) => b.total - a.total);
    },

    async getByProject(projectName: string) {
        if (projectName === 'Senza Progetto') {
            const { data, error } = await supabase
                .from('work_orders')
                .select('*, pianificazioni(data_pianificazione)')
                .is('progetto', null)
                .order('system_updated_at', { ascending: false });

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabase
            .from('work_orders')
            .select('*, pianificazioni(data_pianificazione)')
            .eq('progetto', projectName)
            .order('system_updated_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
