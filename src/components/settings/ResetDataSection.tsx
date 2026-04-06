import { useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import type { ResetTablesSelection } from '../../services/resetSystemService';
import { resetSystemService } from '../../services/resetSystemService';

const CONFIRMATION_TEXT = 'CANCELLA TUTTO';

export function ResetDataSection() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState('');
    const [selection, setSelection] = useState<ResetTablesSelection>({
        workOrders: false,
        listini: false,
        fornitori: false,
    });

    const isSelectionEmpty = !selection.workOrders && !selection.listini && !selection.fornitori;
    const isConfirmValid = confirmationInput === CONFIRMATION_TEXT;
    const canSubmit = !isSelectionEmpty && isConfirmValid && !loading;

    const handleReset = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            await resetSystemService.resetData(selection);
            alert('Dati azzerati con successo!');
            setOpen(false);
            window.location.reload(); // Hard reload to clear all states
        } catch (error: any) {
            alert(error.message || 'Errore durante o reset dei dati.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetModalState = () => {
        setConfirmationInput('');
        setSelection({ workOrders: false, listini: false, fornitori: false });
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-900/50">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                        <ShieldAlert className="h-5 w-5" />
                        Zona Pericolo: Azzeramento Dati
                    </h2>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                        Attenzione: Queste azioni sono irreversibili. Permettono di svuotare massivamente tabelle transazionali.
                    </p>
                </div>

                <Button variant="destructive" className="gap-2" onClick={() => setOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    Opzioni di Azzeramento
                </Button>

                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) resetModalState();
                }}>
                    <div className="hidden" />
                    <DialogContent className="sm:max-w-[500px] border-red-200 dark:border-red-900">
                        <DialogHeader>
                            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5" />
                                Azzeramento Dati Database
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                Seleziona quali aree del sistema desideri azzerare.
                                <br />
                                <strong>Questa operazione eliminerà definitivamente i dati selezionati e non può essere annullata.</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Seleziona i blocchi da azzerare:</h4>

                                <label className="flex items-start space-x-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selection.workOrders}
                                        onChange={(e) => setSelection(prev => ({ ...prev, workOrders: e.target.checked }))}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                                    />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Transazionali (Work Orders & Consuntivi)</p>
                                        <p className="text-xs text-muted-foreground">Svuota: work_orders, work_order_items, pianificazioni, preventivi, consuntivi.</p>
                                    </div>
                                </label>

                                <label className="flex items-start space-x-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selection.listini}
                                        onChange={(e) => setSelection(prev => ({ ...prev, listini: e.target.checked }))}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                                    />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Listini Prezzi</p>
                                        <p className="text-xs text-muted-foreground">Svuota tutte le intestazioni dei listini e le relative voci di prezzo.</p>
                                    </div>
                                </label>

                                <label className="flex items-start space-x-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selection.fornitori}
                                        onChange={(e) => setSelection(prev => ({ ...prev, fornitori: e.target.checked }))}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                                    />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Anagrafiche Fornitori</p>
                                        <p className="text-xs text-muted-foreground">Svuota l'elenco dei fornitori/tecnici registrati.</p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md border border-red-200 dark:border-red-900/50 space-y-3">
                                <Label htmlFor="confirmationText" className="text-red-800 dark:text-red-300 text-sm font-semibold">
                                    Per confermare, digita "{CONFIRMATION_TEXT}"
                                </Label>
                                <Input
                                    id="confirmationText"
                                    value={confirmationInput}
                                    onChange={(e) => setConfirmationInput(e.target.value)}
                                    disabled={isSelectionEmpty}
                                    placeholder={CONFIRMATION_TEXT}
                                    className="border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Annulla
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!canSubmit}
                                onClick={handleReset}
                            >
                                {loading ? 'Cancellazione in corso...' : 'Conferma e Azzera'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
