export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    role: 'admin' | 'supervisor' | 'project_manager' | 'operator'
                    full_name: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email: string
                    role: 'admin' | 'supervisor' | 'project_manager' | 'operator'
                    full_name?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'admin' | 'supervisor' | 'project_manager' | 'operator'
                    full_name?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            fornitori: {
                Row: {
                    id: string
                    ragione_sociale: string
                    p_iva: string | null
                    codice_fiscale: string | null
                    indirizzo: string | null
                    citta: string | null
                    cap: string | null
                    provincia: string | null
                    email: string | null
                    telefono: string | null
                    note: string | null
                    stato: string
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    ragione_sociale: string
                    p_iva?: string | null
                    codice_fiscale?: string | null
                    indirizzo?: string | null
                    citta?: string | null
                    cap?: string | null
                    provincia?: string | null
                    email?: string | null
                    telefono?: string | null
                    note?: string | null
                    stato?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    ragione_sociale?: string
                    p_iva?: string | null
                    codice_fiscale?: string | null
                    indirizzo?: string | null
                    citta?: string | null
                    cap?: string | null
                    provincia?: string | null
                    email?: string | null
                    telefono?: string | null
                    note?: string | null
                    stato?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            consuntivi: {
                Row: {
                    id: string
                    pianificazione_id: string
                    codice_attivita: string
                    quantita: number
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    pianificazione_id: string
                    codice_attivita: string
                    quantita?: number
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    pianificazione_id?: string
                    codice_attivita?: string
                    quantita?: number
                    created_at?: string | null
                }
            }
            listini: {
                Row: {
                    id: string
                    created_at: string
                    price_list_id: string
                    codice: string
                    descrizione: string
                    descrizione_attivita: string | null
                    importo: number
                }
                Insert: {
                    id?: string
                    created_at?: string
                    price_list_id: string
                    codice: string
                    descrizione: string
                    descrizione_attivita?: string | null
                    importo: number
                }
                Update: {
                    id?: string
                    created_at?: string
                    price_list_id?: string
                    codice?: string
                    descrizione?: string
                    descrizione_attivita?: string | null
                    importo?: number
                }
            }
            price_lists: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    type: 'Consuntivo' | 'Fornitore'
                    is_default: boolean
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    type: 'Consuntivo' | 'Fornitore'
                    is_default?: boolean
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    type?: 'Consuntivo' | 'Fornitore'
                    is_default?: boolean
                    is_active?: boolean
                }
            }
            preventivi: {
                Row: {
                    id: string
                    work_order_id: string
                    codice_attivita: string
                    quantita: number
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    codice_attivita: string
                    quantita?: number
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    codice_attivita?: string
                    quantita?: number
                    created_at?: string | null
                }
            }
            work_order_items: {
                Row: {
                    id: string
                    created_at: string
                    work_order_id: string
                    price_list_item_id: string | null
                    pianificazione_id: string | null
                    type: 'preventivo' | 'consuntivo'
                    codice_attivita: string
                    descrizione: string | null
                    quantity: number
                    unit_price: number
                    total_price: number | null // generated
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    work_order_id: string
                    price_list_item_id?: string | null
                    pianificazione_id?: string | null
                    type: 'preventivo' | 'consuntivo'
                    codice_attivita: string
                    descrizione?: string | null
                    quantity?: number
                    unit_price?: number
                    // total_price is generated
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    work_order_id?: string
                    price_list_item_id?: string | null
                    pianificazione_id?: string | null
                    type?: 'preventivo' | 'consuntivo'
                    codice_attivita?: string
                    descrizione?: string | null
                    quantity?: number
                    unit_price?: number
                    updated_at?: string
                }
            }
            pianificazioni: {
                Row: {
                    id: string
                    work_order_id: string
                    data_pianificazione: string | null
                    note_importanti: string | null
                    note_chiusura: string | null
                    esito: 'IN CORSO' | 'OK' | 'NON OK' | null
                    motivazione_fallimento: string | null
                    fornitore_id: string | null
                    price_list_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    data_pianificazione?: string | null
                    note_importanti?: string | null
                    note_chiusura?: string | null
                    esito?: 'IN CORSO' | 'OK' | 'NON OK' | null
                    motivazione_fallimento?: string | null
                    fornitore_id?: string | null
                    price_list_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    data_pianificazione?: string | null
                    note_importanti?: string | null
                    note_chiusura?: string | null
                    esito?: 'IN CORSO' | 'OK' | 'NON OK' | null
                    motivazione_fallimento?: string | null
                    fornitore_id?: string | null
                    price_list_id?: string | null
                    created_at?: string | null
                }
            }
            planning_failure_reasons: {
                Row: {
                    id: string
                    reason: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    reason: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    reason?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            work_orders: {
                Row: {
                    work_order: string
                    numero: string | null
                    progetto: string | null
                    soa_code: string | null
                    breve_descrizione: string | null
                    descrizione: string | null
                    stato: string
                    avvio_programmato: string | null
                    fine_prevista: string | null
                    aggiornato: string | null
                    chiuso: string | null
                    regione: string | null
                    citta: string | null
                    provincia: string | null
                    cap: string | null
                    via: string | null
                    telefono: string | null
                    sede_presidiata: boolean | null
                    created_by: string | null
                    system_created_at: string | null
                    system_updated_at: string | null
                    price_list_id: string | null
                    notes: string | null
                    gestione: string | null
                }
                Insert: {
                    work_order: string
                    numero?: string | null
                    progetto?: string | null
                    soa_code?: string | null
                    breve_descrizione?: string | null
                    descrizione?: string | null
                    stato?: string
                    avvio_programmato?: string | null
                    fine_prevista?: string | null
                    aggiornato?: string | null
                    chiuso?: string | null
                    regione?: string | null
                    citta?: string | null
                    provincia?: string | null
                    cap?: string | null
                    via?: string | null
                    telefono?: string | null
                    sede_presidiata?: boolean | null
                    created_by?: string | null
                    system_created_at?: string | null
                    system_updated_at?: string | null
                    price_list_id?: string | null
                    notes?: string | null
                    gestione?: string | null

                }
                Update: {
                    work_order?: string
                    numero?: string | null
                    progetto?: string | null
                    soa_code?: string | null
                    breve_descrizione?: string | null
                    descrizione?: string | null
                    stato?: string
                    avvio_programmato?: string | null
                    fine_prevista?: string | null
                    aggiornato?: string | null
                    chiuso?: string | null
                    regione?: string | null
                    citta?: string | null
                    provincia?: string | null
                    cap?: string | null
                    via?: string | null
                    telefono?: string | null
                    sede_presidiata?: boolean | null
                    created_by?: string | null
                    system_created_at?: string | null
                    system_updated_at?: string | null
                    price_list_id?: string | null
                    notes?: string | null
                    gestione?: string | null
                }
            }
            project_settings: {
                Row: {
                    project_name: string
                    client_price_list_id: string | null
                    supplier_price_list_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    project_name: string
                    client_price_list_id?: string | null
                    supplier_price_list_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    project_name?: string
                    client_price_list_id?: string | null
                    supplier_price_list_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_current_user_role: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
