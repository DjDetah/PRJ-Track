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

    async getUniqueListini() {
        const { data, error } = await supabase
            .from('price_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to ui-compatible structure if needed, or update UI. 
        // For minimal breakage, we map 'name' back to 'listino' virtual prop if UI expects it.
        return data.map(pl => ({
            ...pl,
            listino: pl.name,
            tipo: pl.type
        }));
    },

    async getDefault(tipo: 'Consuntivo' | 'Fornitore') {
        const { data, error } = await supabase
            .from('price_lists')
            .select('*')
            .eq('type', tipo)
            .eq('is_default', true)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async setAsDefault(listinoName: string, tipo: 'Consuntivo' | 'Fornitore') {
        // 1. Unset default for all of this type
        const { error: unsetError } = await supabase
            .from('price_lists')
            .update({ is_default: false })
            .eq('type', tipo);

        if (unsetError) throw unsetError;

        // 2. Set default for the chosen listino
        const { error: setError } = await supabase
            .from('price_lists')
            .update({ is_default: true })
            .eq('name', listinoName)
            .eq('type', tipo);

        if (setError) throw setError;
    },

    async importFromExcel(listinoName: string, tipo: 'Consuntivo' | 'Fornitore', file: File) {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // 1. Create Header
                    // Check if exists? Unique constraint will handle duplicates, but maybe we want to overwrite?
                    // For now, let's assume new list import. If duplicate name/type, it will fail.
                    // Or we could append timestamp to name if duplicate?
                    // User probably wants to re-upload. Ideally we should warn.
                    // Let's just try insert.
                    const { data: header, error: headerError } = await supabase
                        .from('price_lists')
                        .insert({
                            name: listinoName,
                            type: tipo
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
                        const descrizione_attivita = normalizedRow['descrizione attivita'] || normalizedRow['descrizione_attivita'] || null;
                        const importo = normalizedRow['importo'] ?? normalizedRow['prezzo'] ?? 0;

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

                    if (itemsToInsert.length > 0) {
                        const { error } = await supabase
                            .from('listini')
                            .insert(itemsToInsert);

                        if (error) throw error;
                    }

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
