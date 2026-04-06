import { supabase } from './supabase';

export interface ResetTablesSelection {
    workOrders: boolean; // Includes: work_orders, pianificazioni, work_order_items, preventivi, consuntivi
    listini: boolean;    // Includes: listini, price_lists
    fornitori: boolean;  // Includes: fornitori
}

export const resetSystemService = {
    resetData: async (selection: ResetTablesSelection): Promise<void> => {
        const tablesToTruncate: string[] = [];

        if (selection.workOrders) {
            tablesToTruncate.push(
                'work_orders',
                'pianificazioni',
                'work_order_items',
                'preventivi',
                'consuntivi'
            );
        }

        if (selection.listini) {
            tablesToTruncate.push('listini', 'price_lists');
        }

        if (selection.fornitori) {
            tablesToTruncate.push('fornitori');
        }

        if (tablesToTruncate.length === 0) {
            return;
        }

        const { error } = await supabase.rpc('reset_selected_data', {
            tables_to_truncate: tablesToTruncate,
        });

        if (error) {
            console.error('Error resetting data:', error);
            throw new Error(`Errore durante l'azzeramento dei dati: ${error.message}`);
        }
    },
};
