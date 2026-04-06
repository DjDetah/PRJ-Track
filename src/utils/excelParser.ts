import * as XLSX from 'xlsx';
import { type WorkOrderInsert } from '../services/workOrderService';
import { type Fornitore } from '../services/supplierService';
import { type Database } from '../types/supabase';

type PianificazioneInsert = Database['public']['Tables']['pianificazioni']['Insert'];

// Standard Italian headers as requested
const HEADER_MAP: Record<string, keyof WorkOrderInsert> = {
    'Elemento principale': 'work_order',
    'Numero': 'numero',
    'Progetto': 'progetto',
    'SOA Code': 'soa_code',
    'Breve descrizione': 'breve_descrizione',
    'Descrizione': 'descrizione',
    'Stato': 'stato',
    'Avvio programmato': 'avvio_programmato',
    'Fine prevista': 'fine_prevista',
    'Aggiornato': 'aggiornato',
    'Regione': 'regione',
    'Città': 'citta',
    'Provincia': 'provincia',
    'CAP/Codice postale': 'cap',
    'Telefono': 'telefono',
    'Via': 'via',
    'Sede Presidiata': 'sede_presidiata',
    'Chiuso': 'chiuso',
};

export interface ParseResult {
    validRows: WorkOrderInsert[];
    totalParsed: number;
    emptyCount: number;
    duplicateCount: number;
}

export async function parseExcelWorkOrders(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Parse to JSON with header row (to get actual headers first)
                const firstRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
                const headerRow: any[] = Array.isArray(firstRow) ? (firstRow as any[]) : [];
                const actualHeaders = headerRow.map((h: any) => String(h).trim());

                // Strict validation: check if ALL template columns are present
                const expectedHeaders = Object.keys(HEADER_MAP);
                const missingExpected = expectedHeaders.filter(h => !actualHeaders.includes(h));

                if (missingExpected.length > 0) {
                    return reject(new Error(`File non valido. Il file deve avere le stesse identiche colonne del template. Colonne mancanti: ${missingExpected.join(', ')}`));
                }

                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    raw: false, // Parse dates as formatted strings initially (safest for Excel quirks)
                    dateNF: 'yyyy-mm-dd hh:mm:ss', // Standardize date format if raw=false doesn't catch it
                });

                // Map rows
                const mappedRows: WorkOrderInsert[] = jsonRows.map((row) => {
                    const newRow: any = {};

                    Object.keys(row).forEach((header) => {
                        const dbField = HEADER_MAP[header.trim()];
                        if (dbField) {
                            let value = row[header];

                            // Specific type handling
                            if (dbField === 'sede_presidiata') {
                                // Handle "SI"/"NO" or boolean
                                if (typeof value === 'string') {
                                    newRow[dbField] = value.toUpperCase() === 'SI';
                                } else {
                                    newRow[dbField] = !!value;
                                }
                            } else if (['avvio_programmato', 'fine_prevista', 'aggiornato', 'chiuso'].includes(dbField)) {
                                // Parse Date robustly
                                if (!value) {
                                    newRow[dbField] = null;
                                } else if (typeof value === 'number') {
                                    // Excel serial date (e.g. 45290 = Jan 1, 2024 roughly)
                                    // Excel epoch is Jan 1, 1900. (Javascript is Jan 1, 1970)
                                    // Formula: (serial - 25569) * 86400 * 1000
                                    const date = new Date((value - 25569) * 86400 * 1000);
                                    // Fix timezone offset issues
                                    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                    newRow[dbField] = date.toISOString();
                                } else if (typeof value === 'string') {
                                    // Try basic string parsing
                                    
                                    // 1. Handle comma-separated excel serial decimal (e.g. "46232,72657" or "46232.72657")
                                    const serialMatch = value.match(/^(\d{5})([.,]\d+)?$/);
                                    if (serialMatch) {
                                        const numValue = parseFloat(value.replace(',', '.'));
                                        const date = new Date((numValue - 25569) * 86400 * 1000);
                                        // Fix timezone offset issues
                                        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                        newRow[dbField] = date.toISOString();
                                    } else {
                                        // 2. Handle Italian formats DD/MM/YYYY or DD-MM-YYYY
                                        const itDateMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                                        if (itDateMatch) {
                                            const [_, day, month, year] = itDateMatch;
                                            const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0); // Noon to avoid TZ boundary issues
                                            if (!isNaN(date.getTime())) {
                                                newRow[dbField] = date.toISOString();
                                            } else {
                                                newRow[dbField] = null;
                                            }
                                        } else {
                                            // 3. Native fallback
                                            const date = new Date(value);
                                            if (!isNaN(date.getTime())) {
                                                newRow[dbField] = date.toISOString();
                                            } else {
                                                newRow[dbField] = null;
                                            }
                                        }
                                    }
                                } else {
                                    newRow[dbField] = null;
                                }
                            } else {
                                newRow[dbField] = value;
                            }
                        }
                    });

                    // Default mandatory fields if missing
                    if (!newRow.stato) newRow.stato = 'New';

                    return newRow;
                });

                let emptyCount = 0;
                let duplicateCount = 0;
                const uniqueMap = new Map<string, WorkOrderInsert>();

                mappedRows.forEach(row => {
                    if (!row.work_order) {
                        emptyCount++;
                        return;
                    }
                    if (uniqueMap.has(row.work_order)) {
                        duplicateCount++;
                        // We keep the LAST occurrence (upsert behavior)
                    }
                    uniqueMap.set(row.work_order, row);
                });

                resolve({
                    validRows: Array.from(uniqueMap.values()),
                    totalParsed: mappedRows.length,
                    emptyCount,
                    duplicateCount
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
}

export function downloadWorkOrderTemplate() {
    const headers = Object.keys(HEADER_MAP);
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Auto-size columns to fit headers
    const colWidths = headers.map(h => ({ wch: Math.max(15, h.length + 2) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_WorkOrders");
    XLSX.writeFile(wb, "Template_Importazione_WO.xlsx");
}

// --------------------------------------------------------------------------
// Pianificazioni
// --------------------------------------------------------------------------

const HEADER_MAP_PIANIFICAZIONI: Record<string, keyof PianificazioneInsert | 'fornitore_text'> = {
    'Elemento principale': 'work_order_id',
    'Data Pianificazione': 'data_pianificazione',
    'Fornitore': 'fornitore_text', // virtual column for lookup
    'Note Importanti': 'note_importanti',
    'Esito': 'esito',
    'Motivazione Fallimento': 'motivazione_fallimento',
    'Note Chiusura': 'note_chiusura',
};

export interface PianificazioniParseResult {
    validRows: PianificazioneInsert[];
    totalParsed: number;
    emptyCount: number;
    duplicateCount: number;
    unmappedSuppliersCount: number;
}

export async function parseExcelPianificazioni(file: File, fornitori: Fornitore[]): Promise<PianificazioniParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const firstRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
                const headerRow: any[] = Array.isArray(firstRow) ? (firstRow as any[]) : [];
                const actualHeaders = headerRow.map((h: any) => String(h).trim());

                // Strict validation
                const expectedHeaders = Object.keys(HEADER_MAP_PIANIFICAZIONI);
                const missingExpected = expectedHeaders.filter(h => !actualHeaders.includes(h));

                if (missingExpected.length > 0) {
                    return reject(new Error(`File non valido. Il file deve avere le stesse identiche colonne del template. Colonne mancanti: ${missingExpected.join(', ')}`));
                }

                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    raw: false,
                    dateNF: 'yyyy-mm-dd hh:mm:ss',
                });

                let unmappedSuppliersCount = 0;
                let emptyCount = 0;
                let duplicateCount = 0;
                let errorCount = 0;
                let errorMessages: string[] = [];
                const uniqueMap = new Map<string, PianificazioneInsert>();

                jsonRows.forEach((row) => {
                    const newRow: any = {};
                    let rawFornitore = '';

                    Object.keys(row).forEach((header) => {
                        const dbField = HEADER_MAP_PIANIFICAZIONI[header.trim()];
                        if (dbField) {
                            let value = row[header];

                            if (dbField === 'data_pianificazione') {
                                // Parse Date
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    newRow[dbField] = date.toISOString();
                                } else {
                                    newRow[dbField] = null;
                                }
                            } else if (dbField === 'esito') {
                                const v = String(value).trim().toUpperCase();
                                if (['IN CORSO', 'OK', 'NON OK'].includes(v)) {
                                    newRow[dbField] = v;
                                } else {
                                    newRow[dbField] = null;
                                }
                            } else if (dbField === 'fornitore_text') {
                                rawFornitore = String(value || '').trim();
                            } else {
                                newRow[dbField] = value;
                            }
                        }
                    });

                    // Validation 1: Mandatory Work Order
                    if (!newRow.work_order_id) {
                        emptyCount++;
                        return;
                    }

                    // Validation 2: "NON OK" needs Motivation
                    if (newRow.esito === 'NON OK' && !String(newRow.motivazione_fallimento || '').trim()) {
                        errorCount++;
                        errorMessages.push(`WO ${newRow.work_order_id}: L'esito "NON OK" richiede una Motivazione Fallimento.`);
                        return; // Skip invalid row
                    }

                    // Map Supplier
                    if (rawFornitore) {
                        const foundSupplier = fornitori.find(f => f.ragione_sociale.toLowerCase() === rawFornitore.toLowerCase());
                        if (foundSupplier) {
                            newRow.fornitore_id = foundSupplier.id;
                        } else {
                            unmappedSuppliersCount++;
                            newRow.fornitore_id = null;
                        }
                    }

                    // Unique Key for upsert logic
                    // Se la data è vuota, consideriamo questa pianificazione come una riga univoca "da pianificare"
                    // per evitare collisioni, usiamo un placeholder con un UUID generato localmente
                    const dayOnly = newRow.data_pianificazione ? newRow.data_pianificazione.split('T')[0] : `empty-${Math.random()}`;
                    const compositeKey = `${newRow.work_order_id}_${dayOnly}`;

                    if (uniqueMap.has(compositeKey)) {
                        duplicateCount++;
                        // Last one wins
                    }
                    uniqueMap.set(compositeKey, newRow);
                });

                if (errorCount > 0) {
                    return reject(new Error(`Trovati ${errorCount} errori di validazione nei dati:\n${errorMessages.slice(0, 5).join('\n')}${errorCount > 5 ? '\n...' : ''}`));
                }

                resolve({
                    validRows: Array.from(uniqueMap.values()),
                    totalParsed: jsonRows.length,
                    emptyCount,
                    duplicateCount,
                    unmappedSuppliersCount,
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
}

export function downloadPianificazioniTemplate() {
    const headers = Object.keys(HEADER_MAP_PIANIFICAZIONI);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const colWidths = headers.map(h => ({ wch: Math.max(15, h.length + 2) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Pianificazioni");
    XLSX.writeFile(wb, "Template_Importazione_Pianificazioni.xlsx");
}

// --------------------------------------------------------------------------
// Listini (Price Lists)
// --------------------------------------------------------------------------

const HEADER_MAP_LISTINI: Record<string, string> = {
    'Codice': 'codice',
    'Descrizione': 'descrizione',
    'Descrizione Attività': 'descrizione_attivita',
    'Importo': 'importo'
};

export async function parseExcelListini(file: File): Promise<{ validRows: any[]; emptyCount: number; duplicateCount: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const firstRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
                const headerRow: any[] = Array.isArray(firstRow) ? (firstRow as any[]) : [];
                const actualHeaders = headerRow.map((h: any) => String(h).trim());

                // Strict validation
                const expectedHeaders = Object.keys(HEADER_MAP_LISTINI);
                const missingExpected = expectedHeaders.filter(h => !actualHeaders.includes(h));

                if (missingExpected.length > 0) {
                    return reject(new Error(`File non valido. Il file deve avere le stesse identiche colonne del template. Colonne mancanti: ${missingExpected.join(', ')}`));
                }

                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    raw: false,
                });

                let emptyCount = 0;
                let duplicateCount = 0;
                const validRows: any[] = [];
                const uniqueCodes = new Set<string>();

                jsonRows.forEach((row) => {
                    const newRow: any = {};
                    
                    Object.keys(row).forEach((header) => {
                        const hTrimmed = header.trim();
                        const dbField = HEADER_MAP_LISTINI[hTrimmed];
                        if (dbField) {
                            newRow[dbField] = row[header];
                        }
                    });

                    if (!newRow.codice || !newRow.descrizione) {
                        emptyCount++;
                        return;
                    }

                    if (uniqueCodes.has(newRow.codice)) {
                        duplicateCount++;
                        // skip duplicate code
                        return;
                    }
                    uniqueCodes.add(newRow.codice);

                    if (newRow.importo) {
                        newRow.importo = Number(String(newRow.importo).replace(',', '.'));
                        if (isNaN(newRow.importo)) newRow.importo = 0;
                    } else {
                        newRow.importo = 0;
                    }

                    validRows.push(newRow);
                });

                resolve({
                    validRows,
                    emptyCount,
                    duplicateCount,
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
}

export function downloadListinoTemplate() {
    const headers = [
        'Codice',
        'Descrizione',
        'Descrizione Attività',
        'Importo'
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    const colWidths = [
        { wch: 15 }, // Codice
        { wch: 50 }, // Descrizione
        { wch: 50 }, // Descrizione Attività
        { wch: 15 }, // Importo
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Listino");
    XLSX.writeFile(wb, "Template_Importazione_Listino.xlsx");
}
