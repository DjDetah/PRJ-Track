import * as XLSX from 'xlsx';
import { type WorkOrderInsert } from '../services/workOrderService';

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

export async function parseExcelWorkOrders(file: File): Promise<WorkOrderInsert[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Parse to JSON with header row
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
                                // Parse Date
                                // If it's a string, try creating a date.
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    newRow[dbField] = date.toISOString();
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
                }).filter(r => r.work_order); // Only keep rows with a PK

                resolve(mappedRows);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
}
