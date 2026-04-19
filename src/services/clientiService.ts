import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Cliente = Database['public']['Tables']['clienti']['Row'];
export type UserCliente = Database['public']['Tables']['user_clienti']['Row'];

export const clientiService = {
    // 1. Get all clients (For Admin configuration)
    async getAllClienti(): Promise<Cliente[]> {
        const { data, error } = await supabase
            .from('clienti')
            .select('*')
            .order('nome_cliente', { ascending: true });

        if (error) {
            console.error('Error fetching all clienti:', error);
            throw error;
        }

        return data || [];
    },

    // 2. Get specific clients assigned to a user profile
    async getClientiForUser(profileId: string): Promise<Cliente[]> {
        // We use a foreign table inner join capability of supabase
        // because user_clienti is a junction table linking profiles to clienti
        const { data, error } = await supabase
            .from('user_clienti')
            .select(`
                cliente_id,
                clienti (
                    id,
                    nome_cliente,
                    colore_hex,
                    created_at,
                    updated_at
                )
            `)
            .eq('profile_id', profileId);

        if (error) {
            console.error('Error fetching user clienti:', error);
            throw error;
        }

        // Mapping to extract the inner Clienti object
        const mapped: Cliente[] = [];
        data?.forEach((row: any) => {
            if (row.clienti) {
                // If it returns an array vs single object depends on relationship, assume single object for standard 1:N / N:1 mapping
                if (Array.isArray(row.clienti)) {
                    mapped.push(...row.clienti);
                } else {
                    mapped.push(row.clienti as Cliente);
                }
            }
        });

        // Dedup and sort
        return mapped.sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente));
    },

    // 3. Upsert a client
    async upsertCliente(cliente: Partial<Cliente>): Promise<Cliente> {
        const { data, error } = await supabase
            .from('clienti')
            .upsert([cliente])
            .select()
            .single();

        if (error) {
            console.error('Error upserting cliente:', error);
            throw error;
        }

        return data;
    },

    // 4. Delete a client
    async deleteCliente(id: string): Promise<void> {
        const { error } = await supabase
            .from('clienti')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting cliente:', error);
            throw error;
        }
    },

    // 5. Update assigned clients for a user
    async assignClientiToUser(profileId: string, clientIds: string[]): Promise<void> {
        // Delete all bindings first
        const { error: deleteError } = await supabase
            .from('user_clienti')
            .delete()
            .eq('profile_id', profileId);

        if (deleteError) {
            console.error('Error removing old user_clienti bindings:', deleteError);
            throw deleteError;
        }

        if (clientIds.length > 0) {
            const inserts = clientIds.map(cid => ({
                profile_id: profileId,
                cliente_id: cid
            }));

            const { error: insertError } = await supabase
                .from('user_clienti')
                .insert(inserts);

            if (insertError) {
                console.error('Error inserting user_clienti bindings:', insertError);
                throw insertError;
            }
        }
    }
};
