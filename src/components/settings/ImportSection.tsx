import React, { useState } from 'react';
import { parseExcelWorkOrders, downloadWorkOrderTemplate, parseExcelPianificazioni, downloadPianificazioniTemplate, downloadListinoTemplate, parseExcelListini } from '../../utils/excelParser';
import { workOrderService } from '../../services/workOrderService';
import { pianificazioneService } from '../../services/pianificazioneService';
import { supplierService } from '../../services/supplierService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ScrollText, Download, CalendarDays } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { priceListService } from '../../services/priceListService';
import { useClient } from '../../contexts/ClientContext';
import { projectSettingsService } from '../../services/projectSettingsService';

export function ImportSection() {
    const { activeCliente } = useClient();
    const [file, setFile] = useState<File | null>(null);
    const [previewType, setPreviewType] = useState<'wo' | 'pian' | 'listino' | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [statsMsg, setStatsMsg] = useState<{ empty: number, duplicate: number } | null>(null);

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setErrorMsg(null);
        setSuccessMsg(null);
        setStatsMsg(null);
        try {
            const result = await parseExcelWorkOrders(selectedFile);
            setPreviewData(result.validRows);
            setPreviewType('wo');
            if (result.emptyCount > 0 || result.duplicateCount > 0) {
                setStatsMsg({ empty: result.emptyCount, duplicate: result.duplicateCount });
            }
        } catch (err: any) {
            let message = 'Errore nella lettura del file Excel (Work Order). Verifica il formato.';
            if (err instanceof Error && err.message.includes('File non valido')) {
                message = err.message;
            }
            setErrorMsg(message);
            console.error(err);
        }
    };

    const handleFilePianificazioni = async (selectedFile: File) => {
        setFile(selectedFile);
        setErrorMsg(null);
        setSuccessMsg(null);
        setStatsMsg(null);
        try {
            const fornitori = await supplierService.getAll();
            const result = await parseExcelPianificazioni(selectedFile, fornitori);
            setPreviewData(result.validRows);
            setPreviewType('pian');
            if (result.emptyCount > 0 || result.duplicateCount > 0 || result.unmappedSuppliersCount > 0) {
                setStatsMsg({
                    empty: result.emptyCount,
                    duplicate: result.duplicateCount,
                    unmappedSuppliers: result.unmappedSuppliersCount
                } as any);
            }
        } catch (err: any) {
            let message = 'Errore nella lettura del file Excel (Pianificazioni). Verifica il formato.';
            if (err instanceof Error && err.message.includes('File non valido')) {
                message = err.message;
            }
            setErrorMsg(message);
            console.error(err);
        }
    };

    const handleFileListino = async (selectedFile: File) => {
        setFile(selectedFile);
        setErrorMsg(null);
        setSuccessMsg(null);
        setStatsMsg(null);
        try {
            const result = await parseExcelListini(selectedFile);
            setPreviewData(result.validRows);
            setPreviewType('listino');
            if (result.emptyCount > 0 || result.duplicateCount > 0) {
                setStatsMsg({ empty: result.emptyCount, duplicate: result.duplicateCount } as any);
            }
        } catch (err: any) {
            let message = 'Errore nella lettura del file Excel (Listino). Verifica il formato.';
            if (err instanceof Error && err.message.includes('File non valido')) {
                message = err.message;
            }
            setErrorMsg(message);
            console.error(err);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!previewData.length || !previewType) return;
        setUploading(true);
        setErrorMsg(null);

        try {
            let listinoHeaderId: string | null = null;
            if (previewType === 'listino') {
                const listinoType = (file?.name.toLowerCase().includes('fornitore')) ? 'Fornitore' : 'Consuntivo';
                const listinoName = file?.name.replace(/\.[^/.]+$/, "") || 'Nuovo Listino';
                const headerRes = await priceListService.createHeader(listinoName, listinoType, activeCliente?.id);
                if (headerRes.error) {
                     setErrorMsg(`Errore creazione testata listino: ${headerRes.error.message}`);
                     setUploading(false);
                     return;
                }
                listinoHeaderId = headerRes.data?.id || null;
                if (!listinoHeaderId) {
                     setErrorMsg(`Errore creazione testata listino.`);
                     setUploading(false);
                     return;
                }
            }

            let successCount = 0;
            let failCount = 0;
            const batchSize = 50;
            for (let i = 0; i < previewData.length; i += batchSize) {
                const batch = previewData.slice(i, batchSize + i);

                let error = null;
                if (previewType === 'wo') {
                    // Extract unique projects to ensure they are created in project_settings with active client
                    const uniqueProjects = new Set<string>();
                    for (const wo of batch) {
                        if (wo.progetto) uniqueProjects.add(wo.progetto);
                    }
                    // Upsert projects to ensure they are tied to client (no supplier/client lists assigned initially)
                    for (const p of uniqueProjects) {
                        await projectSettingsService.upsertSettings(p, null, null, activeCliente?.id);
                    }
                    
                    const res = await workOrderService.createBulk(batch, activeCliente?.id);
                    error = res.error;
                } else if (previewType === 'pian') {
                    const res = await pianificazioneService.createBulk(batch);
                    error = res.error;
                } else if (previewType === 'listino') {
                    const res = await priceListService.createBulkItems(batch, listinoHeaderId!);
                    error = res.error;
                }

                if (error) {
                    console.error('Batch import error:', error);
                    if (failCount === 0) {
                        setErrorMsg(`Errore Supabase: ${error.message}`);
                    }
                    failCount += batch.length;
                } else {
                    successCount += batch.length;
                }
            }

            if (failCount > 0) {
                setErrorMsg(`Importazione completata parzialmente. ${successCount} inseriti, ${failCount} falliti.`);
            } else {
                setSuccessMsg(`Importazione completata con successo! ${successCount} record inseriti.`);
                setFile(null);
                setPreviewData([]);
                setPreviewType(null);
            }

        } catch (err: any) {
            setErrorMsg('Errore di sistema: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Download className="h-5 w-5 text-green-600" />
                        Importazione Dati
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Carica dati massivi da file Excel (Work Order e Listini).
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Work Orders Import Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                                Work Orders
                            </CardTitle>
                            <CardDescription>Carica file .xlsx con i dati dei Work Orders.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadWorkOrderTemplate} className="gap-2 shrink-0">
                            <Download className="h-4 w-4" />
                            Scarica Template
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-slate-300 dark:border-slate-700 hover:border-primary'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <input
                                id="fileInput"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-2">
                                {file ? (
                                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                                ) : (
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <p className="text-xs font-medium">
                                    {file ? file.name : 'Trascina o clicca per caricare'}
                                </p>
                            </div>
                        </div>

                        {previewData.length > 0 && (
                            <div className="mt-4">
                                <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importazione...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importa {previewData.length} Righe
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pianificazioni Import Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Pianificazioni
                            </CardTitle>
                            <CardDescription>Carica file .xlsx con le pianificazioni interventi.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadPianificazioniTemplate} className="gap-2 shrink-0">
                            <Download className="h-4 w-4" />
                            Scarica Template
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-slate-300 dark:border-slate-700 hover:border-primary'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleFilePianificazioni(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => document.getElementById('fileInputPianificazioni')?.click()}
                        >
                            <input
                                id="fileInputPianificazioni"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFilePianificazioni(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-2">
                                {(file && previewType === 'pian') ? (
                                    <CalendarDays className="h-8 w-8 text-blue-500" />
                                ) : (
                                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                                )}
                                <p className="text-xs font-medium">
                                    {(file && previewType === 'pian') ? file.name : 'Trascina o clicca per caricare'}
                                </p>
                            </div>
                        </div>

                        {previewData.length > 0 && previewType === 'pian' && (
                            <div className="mt-4">
                                <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importazione...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importa {previewData.length} Righe
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Price List Import Card */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ScrollText className="h-5 w-5 text-primary" />
                                    Importa Listino
                                </CardTitle>
                                <CardDescription>Carica listini prezzi (Consuntivo o Fornitore).</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={downloadListinoTemplate} className="gap-2 shrink-0">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Scarica Template</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-slate-300 dark:border-slate-700 hover:border-primary'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleFileListino(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => document.getElementById('fileInputListino')?.click()}
                        >
                            <input
                                id="fileInputListino"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileListino(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-2">
                                {(file && previewType === 'listino') ? (
                                    <ScrollText className="h-8 w-8 text-primary" />
                                ) : (
                                    <ScrollText className="h-8 w-8 text-muted-foreground" />
                                )}
                                <p className="text-xs font-medium">
                                    {(file && previewType === 'listino') ? file.name : 'Trascina o clicca per caricare listino'}
                                </p>
                            </div>
                        </div>

                        {previewData.length > 0 && previewType === 'listino' && (
                            <div className="mt-4">
                                <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importazione...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importa {previewData.length} Voci
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            <div className="space-y-4">
                {errorMsg && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errore</AlertTitle>
                        <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                )}

                {statsMsg && !errorMsg && !successMsg && (
                    <Alert className="border-amber-500 text-amber-600 dark:text-amber-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Analisi File (Attenzione)</AlertTitle>
                        <AlertDescription>
                            Sono state ignorate delle righe non valide o applicate correzioni:
                            <ul className="list-disc ml-5 mt-1 text-sm">
                                {statsMsg.empty > 0 && <li><strong>{statsMsg.empty}</strong> righe prive di dati essenziali.</li>}
                                {statsMsg.duplicate > 0 && <li><strong>{statsMsg.duplicate}</strong> righe duplicate (l'import aggiornerà l'ultima occorrenza per evitare conflitti).</li>}
                                {(statsMsg as any).unmappedSuppliers > 0 && <li><strong>{(statsMsg as any).unmappedSuppliers}</strong> fornitori non mappati, i testi non corrispondono a Fornitori in DB (campo lasciato vuoto).</li>}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {successMsg && (
                    <Alert className="border-green-500 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Successo</AlertTitle>
                        <AlertDescription>{successMsg}</AlertDescription>
                    </Alert>
                )}

                {previewData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Anteprima Dati ({previewType === 'wo' ? 'Work Orders' : previewType === 'pian' ? 'Pianificazioni' : 'Listini'})</CardTitle>
                            <CardDescription>Prime 5 righe rilevate pronte all'import</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    {previewType === 'wo' ? (
                                        <tr className="border-b">
                                            <th className="text-left p-2">WO</th>
                                            <th className="text-left p-2">Città</th>
                                            <th className="text-left p-2">Stato</th>
                                        </tr>
                                    ) : previewType === 'pian' ? (
                                        <tr className="border-b">
                                            <th className="text-left p-2">WO</th>
                                            <th className="text-left p-2">Data Pian.</th>
                                            <th className="text-left p-2">Esito</th>
                                        </tr>
                                    ) : (
                                        <tr className="border-b">
                                            <th className="text-left p-2">Codice</th>
                                            <th className="text-left p-2">Descrizione</th>
                                            <th className="text-left p-2">Importo</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b">
                                            {previewType === 'wo' ? (
                                                <>
                                                    <td className="p-2 font-medium">{row.work_order}</td>
                                                    <td className="p-2">{row.citta}</td>
                                                    <td className="p-2">{row.stato}</td>
                                                </>
                                            ) : previewType === 'pian' ? (
                                                <>
                                                    <td className="p-2 font-medium">{row.work_order_id}</td>
                                                    <td className="p-2">{row.data_pianificazione ? new Date(row.data_pianificazione).toLocaleDateString() : ''}</td>
                                                    <td className="p-2">{row.esito}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-2 font-medium">{row.codice}</td>
                                                    <td className="p-2 truncate max-w-[200px]" title={row.descrizione}>{row.descrizione}</td>
                                                    <td className="p-2">€ {row.importo}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </section>
    );
}
