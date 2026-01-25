import React, { useState } from 'react';
import { parseExcelWorkOrders } from '../../utils/excelParser';
import { workOrderService, type WorkOrderInsert } from '../../services/workOrderService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ScrollText, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { ListinoImportModal } from '../../pages/import/components/ListinoImportModal';
import { priceListService } from '../../services/priceListService';

export function ImportSection() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<WorkOrderInsert[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const data = await parseExcelWorkOrders(selectedFile);
            setPreviewData(data);
        } catch (err: any) {
            setErrorMsg('Errore nella lettura del file Excel. Verifica il formato.');
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
        if (!previewData.length) return;
        setUploading(true);
        setErrorMsg(null);

        try {
            let successCount = 0;
            let failCount = 0;
            const batchSize = 50;
            for (let i = 0; i < previewData.length; i += batchSize) {
                const batch = previewData.slice(i, batchSize + i);
                const { error } = await workOrderService.createBulk(batch);
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
                setSuccessMsg(`Importazione completata con successo! ${successCount} Work Orders inseriti.`);
                setFile(null);
                setPreviewData([]);
            }

        } catch (err: any) {
            setErrorMsg('Errore di sistema: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Listino State
    const [listinoModalOpen, setListinoModalOpen] = useState(false);
    const [listinoConfig, setListinoConfig] = useState<{ name: string; type: 'Consuntivo' | 'Fornitore' } | null>(null);

    const handleListinoConfirm = (name: string, type: 'Consuntivo' | 'Fornitore') => {
        setListinoConfig({ name, type });
        setListinoModalOpen(false);
        document.getElementById('fileInputListino')?.click();
    };

    const handleListinoFile = async (selectedFile: File) => {
        if (!listinoConfig) return;

        setUploading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            await priceListService.importFromExcel(listinoConfig.name, listinoConfig.type, selectedFile);
            setSuccessMsg(`Listino "${listinoConfig.name}" importato con successo!`);
        } catch (err: any) {
            console.error(err);
            setErrorMsg('Errore importazione listino: ' + err.message);
        } finally {
            setUploading(false);
            setListinoConfig(null);
            const input = document.getElementById('fileInputListino') as HTMLInputElement;
            if (input) input.value = '';
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Work Orders
                        </CardTitle>
                        <CardDescription>Carica file .xlsx con i dati dei Work Orders.</CardDescription>
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

                {/* Price List Import Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ScrollText className="h-5 w-5 text-primary" />
                            Importa Listino
                        </CardTitle>
                        <CardDescription>Carica listini prezzi (Consuntivo o Fornitore).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setListinoModalOpen(true)}
                        >
                            <input
                                id="fileInputListino"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleListinoFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-2">
                                <ScrollText className="h-8 w-8 text-slate-400" />
                                <p className="text-xs font-medium text-muted-foreground">
                                    Clicca per configurare e importare un listino
                                </p>
                            </div>
                        </div>
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
                            <CardTitle>Anteprima Dati (Work Orders)</CardTitle>
                            <CardDescription>Prime 5 righe rilevate</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">WO</th>
                                        <th className="text-left p-2">Città</th>
                                        <th className="text-left p-2">Stato</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-2 font-medium">{row.work_order}</td>
                                            <td className="p-2">{row.citta}</td>
                                            <td className="p-2">{row.stato}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>

            <ListinoImportModal
                open={listinoModalOpen}
                onOpenChange={setListinoModalOpen}
                onConfirm={handleListinoConfirm}
            />
        </section>
    );
}
