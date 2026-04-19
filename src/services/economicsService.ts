import { supabase } from './supabase';
import { type Database } from '../types/supabase';

export type WorkOrderItem = Database['public']['Tables']['work_order_items']['Row'];
export type WorkOrderItemInsert = Database['public']['Tables']['work_order_items']['Insert'];
export type WorkOrderItemUpdate = Database['public']['Tables']['work_order_items']['Update'];

// Type for the items available in the price list (from 'listini' table)
export type ListinoItem = Database['public']['Tables']['listini']['Row'];

export const economicsService = {
    // CRUD for Work Order Items (Preventivi & Consuntivi)
    async getByWorkOrder(workOrderId: string) {
        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getByPlanning(planningId: string) {
        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('pianificazione_id', planningId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async add(item: WorkOrderItemInsert) {
        const { data, error } = await supabase
            .from('work_order_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: WorkOrderItemUpdate) {
        const { data, error } = await supabase
            .from('work_order_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('work_order_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Lookup methods for Price List Items
    async getAvailableItems(priceListId: string) {
        const { data, error } = await supabase
            .from('listini')
            .select('*')
            .eq('price_list_id', priceListId)
            .order('codice', { ascending: true });

        if (error) throw error;
        return data;
    },

    async importConsuntivi(file: File, workOrderId: string, pianificazioneId: string, priceListId: string) {
        return this.importItems(file, workOrderId, 'consuntivo', priceListId, pianificazioneId);
    },

    async importPreventivi(file: File, workOrderId: string, priceListId: string) {
        return this.importItems(file, workOrderId, 'preventivo', priceListId);
    },

    async importItems(
        file: File,
        workOrderId: string,
        type: 'preventivo' | 'consuntivo',
        priceListId: string,
        pianificazioneId?: string
    ) {
        return new Promise<{ imported: number; errors: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // 1. Fetch Price List Items for lookup
                    const { data: priceListItems, error: plError } = await supabase
                        .from('listini')
                        .select('*')
                        .eq('price_list_id', priceListId);

                    if (plError) throw plError;

                    const itemMap = new Map(priceListItems?.map(i => [i.codice.toLowerCase().trim(), i]));

                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = await import('xlsx').then(x => x.read(data, { type: 'array' }));
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = (await import('xlsx')).utils.sheet_to_json(worksheet);

                    const itemsToInsert: WorkOrderItemInsert[] = [];
                    let errors = 0;

                    for (const row of jsonData as any[]) {
                        // Normalize keys
                        const normalizedRow = Object.keys(row).reduce((acc, key) => {
                            acc[key.toLowerCase().trim()] = row[key];
                            return acc;
                        }, {} as any);

                        const codice = normalizedRow['codice'];
                        const quantita = normalizedRow['quantita'] ?? normalizedRow['quantità'] ?? normalizedRow['qta'] ?? 0;

                        if (codice && quantita > 0) {
                            const normalizedCode = String(codice).toLowerCase().trim();
                            const matchedItem = itemMap.get(normalizedCode);

                            if (matchedItem) {
                                itemsToInsert.push({
                                    work_order_id: workOrderId,
                                    type: type,
                                    // Only set pianificazione_id if type is consuntivo and it's provided
                                    pianificazione_id: type === 'consuntivo' ? pianificazioneId : null,
                                    price_list_item_id: matchedItem.id,
                                    codice_attivita: matchedItem.codice,
                                    descrizione: matchedItem.descrizione,
                                    unit_price: matchedItem.importo,
                                    quantity: Number(quantita)
                                });
                            } else {
                                console.warn(`Codice non trovato nel listino: ${codice}`);
                                errors++;
                            }
                        }
                    }

                    if (itemsToInsert.length > 0) {
                        const { error } = await supabase
                            .from('work_order_items')
                            .insert(itemsToInsert);

                        if (error) throw error;
                    }

                    resolve({ imported: itemsToInsert.length, errors });

                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    },

    async copyFromPreventivo(workOrderId: string) {
        // ... (existing code, ensure it matches previous context if I need to replace it entirely, but here I am appending or inserting)
        // Actually, I'll just append this new method at the end of the object.
        // Wait, replace_file_content replaces a block. I need to be careful to match the existing content or surrounding lines.
        // I will use START LINE after the previous method.

        // Let's assume I am inserting before the closing brace of the object.

        // 1. Get Preventivo items
        const { data: preventivoItems, error: prevError } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('work_order_id', workOrderId)
            .eq('type', 'preventivo');

        if (prevError) throw prevError;
        if (!preventivoItems || preventivoItems.length === 0) return { count: 0 };

        // 2. Prepare items for Consuntivo Cliente
        // Cast as any because 'consuntivo_cliente' is not yet in the generated types
        const itemsToInsert = preventivoItems.map(item => ({
            work_order_id: workOrderId,
            type: 'consuntivo_cliente' as any,
            price_list_item_id: item.price_list_item_id,
            codice_attivita: item.codice_attivita,
            descrizione: item.descrizione,
            unit_price: item.unit_price,
            quantity: item.quantity,
            pianificazione_id: null
        }));

        // 3. Insert items
        const { error: insertError } = await supabase
            .from('work_order_items')
            .insert(itemsToInsert as any);

        if (insertError) throw insertError;

        return { count: itemsToInsert.length };
    },

    async getProjectEconomics(projectName: string, activeClientId?: string | null) {
        if (!projectName) return { budget: 0, actual: 0, cost: 0 };

        // Fetch all items for work orders belonging to this project
        // Note: Supabase join filtering requires the referenced table to be part of the select
        // and using !inner for filtering.
        let query = supabase
            .from('work_order_items')
            .select('unit_price, quantity, total_price, type, work_orders!inner(progetto, cliente_id)');

        if (projectName === 'Senza Progetto') {
            query = query.is('work_orders.progetto', null);
        } else {
            query = query.eq('work_orders.progetto', projectName);
        }

        if (activeClientId) {
            query = query.eq('work_orders.cliente_id', activeClientId);
        }

        const { data, error } = await query;

        if (error) throw error;

        let budget = 0;
        let actual = 0;
        let cost = 0;

        data?.forEach((item: any) => {
            const amount = item.total_price ?? (item.unit_price * item.quantity);
            if (item.type === 'preventivo') budget += amount;
            else if (item.type === 'consuntivo_cliente') actual += amount;
            else if (item.type === 'consuntivo') cost += amount;
        });

        return { budget, actual, cost };
    },

    async getAllProjectEconomics(activeClientId?: string | null) {
        let query = supabase
            .from('work_order_items')
            .select('unit_price, quantity, total_price, type, work_orders!inner(progetto, cliente_id)');

        if (activeClientId) {
            query = query.eq('work_orders.cliente_id', activeClientId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const economicsMap: Record<string, { budget: number; actual: number; cost: number }> = {};

        data?.forEach((item: any) => {
            const project = item.work_orders?.progetto || 'Senza Progetto';
            if (!economicsMap[project]) {
                economicsMap[project] = { budget: 0, actual: 0, cost: 0 };
            }

            const amount = item.total_price ?? (item.unit_price * item.quantity);
            if (item.type === 'preventivo') economicsMap[project].budget += amount;
            else if (item.type === 'consuntivo_cliente') economicsMap[project].actual += amount;
            else if (item.type === 'consuntivo') economicsMap[project].cost += amount;
        });

        return economicsMap;
    },

    async getOverallEconomics(activeClientId?: string | null) {
        // Fetch ALL items to calculate global stats
        let query = supabase
            .from('work_order_items')
            .select('unit_price, quantity, total_price, type, work_orders!inner(cliente_id)');

        if (activeClientId) {
            query = query.eq('work_orders.cliente_id', activeClientId);
        }

        const { data, error } = await query;

        if (error) throw error;

        let budget = 0;
        let actual = 0;
        let cost = 0;

        data?.forEach((item: any) => {
            const amount = item.total_price ?? (item.unit_price * item.quantity);
            if (item.type === 'preventivo') budget += amount;
            else if (item.type === 'consuntivo_cliente') actual += amount;
            else if (item.type === 'consuntivo') cost += amount;
        });

        return { budget, actual, cost };
    }
};
