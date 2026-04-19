import { supabase } from './supabase';
import { type Database } from '../types/supabase';
import * as XLSX from 'xlsx';

export type Listino = Database['public']['Tables']['listini']['Row'];
export type ListinoInsert = Database['public']['Tables']['listini']['Insert'];
export type PriceList = Database['public']['Tables']['price_lists']['Row'];

export const priceListService = {
    // OLD: getListini (rows). NEW: Use getUniqueListini for headers usually.
    // Keeping this for compatibility if used somewhere for raw rows, but likely needs updates if columns changed.
    // For now, let's focus on the refactor methods.

    async getUniqueListini(activeClientId?: string | null) {
        let query = supabase
            .from('price_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeClientId) {
            query = query.eq('cliente_id', activeClientId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map to ui-compatible structure if needed, or update UI. 
        // For minimal breakage, we map 'name' back to 'listino' virtual prop if UI expects it.
        return data.map(pl => ({
            ...pl,
            listino: pl.name,
            tipo: pl.type
        }));
    },

    async getDefault(tipo: 'Consuntivo' | 'Fornitore', activeClientId?: string | null) {
        let query = supabase
            .from('price_lists')
            .select('*')
            .eq('type', tipo)
            .eq('is_default', true);

        if (activeClientId) {
            query = query.eq('cliente_id', activeClientId);
        }

        const { data, error } = await query.limit(1).single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async setAsDefault(id: string, tipo: 'Consuntivo' | 'Fornitore', activeClientId?: string | null) {
        // 1. Unset default for all of this type (and optionally scoped by client)
        let unsetQuery = supabase
            .from('price_lists')
            .update({ is_default: false })
            .eq('type', tipo);

        if (activeClientId) {
            unsetQuery = unsetQuery.eq('cliente_id', activeClientId);
        }

        const { error: unsetError } = await unsetQuery;

        if (unsetError) throw unsetError;

        // 2. Set default for the chosen listino
        const { error: setError } = await supabase
            .from('price_lists')
            .update({ is_default: true })
            .eq('id', id);

        if (setError) throw setError;
    },

    async updateListino(id: string, updates: { name?: string; type?: 'Consuntivo' | 'Fornitore'; is_active?: boolean }) {
        const { error } = await supabase
            .from('price_lists')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async createHeader(name: string, type: 'Consuntivo' | 'Fornitore', activeClientId?: string | null) {
        return await supabase
            .from('price_lists')
            .insert({ name, type, cliente_id: activeClientId || null })
            .select()
            .single();
    },

    async createBulkItems(items: any[], headerId: string) {
        // Tag all items with headerId
        const batch: ListinoInsert[] = items.map(item => ({
            price_list_id: headerId,
            codice: String(item.codice),
            descrizione: String(item.descrizione),
            descrizione_attivita: item.descrizione_attivita ? String(item.descrizione_attivita) : null,
            importo: Number(item.importo) || 0
        }));

        const { error } = await supabase.from('listini').insert(batch);
        return { error };
    },

    async importFromExcel(listinoName: string, tipo: 'Consuntivo' | 'Fornitore', file: File, activeClientId?: string | null) {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const { data: header, error: headerError } = await supabase
                        .from('price_lists')
                        .insert({
                            name: listinoName,
                            type: tipo,
                            cliente_id: activeClientId || null
                        })
                        .select()
                        .single();

                    if (headerError) throw new Error(`Errore creazione testata: ${headerError.message}`);
                    const priceListId = header.id;

                    const itemsToInsert: ListinoInsert[] = [];

                    for (const row of jsonData as any[]) {
                        // Normalize keys
                        const normalizedRow = Object.keys(row).reduce((acc, key) => {
                            acc[key.toLowerCase().trim()] = row[key];
                            return acc;
                        }, {} as any);

                        const codice = normalizedRow['codice'];
                        const descrizione = normalizedRow['descrizione'];
                        const descrizione_attivita = normalizedRow['descrizione attività'] || normalizedRow['descrizione attivita'] || null;
                        const importo = normalizedRow['importo'] ?? 0;

                        if (codice && descrizione) {
                            itemsToInsert.push({
                                price_list_id: priceListId,
                                codice: String(codice),
                                descrizione: String(descrizione),
                                descrizione_attivita: descrizione_attivita ? String(descrizione_attivita) : null,
                                importo: Number(importo)
                            });
                        }
                    }

                    if (itemsToInsert.length === 0) {
                        // Rollback header manually (optional, but good practice since no items were inserted)
                        await supabase.from('price_lists').delete().eq('id', header.id);
                        throw new Error("Nessun articolo valido trovato nel file. Verifica che le colonne 'Codice' e 'Descrizione' siano presenti e compilate correttamente.");
                    }

                    const { error } = await supabase
                            .from('listini')
                            .insert(itemsToInsert);

                        if (error) throw error;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
};
