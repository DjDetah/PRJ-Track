import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { MapPin, ClipboardList, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { settingsService, type FailureReason } from '../../../services/settingsService';
import { WorkOrderDetailModal } from '../../work-orders/components/WorkOrderDetailModal';

interface DailyTableProps {
    data: any[];
    onUpdateOutcome: (id: string, esito: 'IN CORSO' | 'OK' | 'NON OK', motivazione?: string) => void;
}

export function DailyTable({ data, onUpdateOutcome }: DailyTableProps) {
    const [motivazioneModalOpen, setMotivazioneModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [failureReasons, setFailureReasons] = useState<FailureReason[]>([]);
    const [selectedReason, setSelectedReason] = useState<string>('');

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<any | null>(null);

    // Load failure reasons when modal opens (or lazy load)
    useEffect(() => {
        if (motivazioneModalOpen) {
            settingsService.getAllFailureReasons().then(reasons => {
                setFailureReasons(reasons?.filter(r => r.is_active) || []);
            });
        }
    }, [motivazioneModalOpen]);

    const handleOutcomeChange = (id: string, newValue: string) => {
        if (newValue === 'NON OK') {
            setSelectedId(id);
            setSelectedReason(''); // Reset
            setMotivazioneModalOpen(true);
        } else {
            onUpdateOutcome(id, newValue as any);
        }
    };

    const confirmFailure = () => {
        if (selectedId && selectedReason) {
            onUpdateOutcome(selectedId, 'NON OK', selectedReason);
            setMotivazioneModalOpen(false);
            setSelectedId(null);
        }
    };

    const handleRowClick = (wo: any, e: React.MouseEvent) => {
        // Prevent opening when clicking dropdown or other interactive elements
        if ((e.target as HTMLElement).closest('select') || (e.target as HTMLElement).closest('.stop-propagation')) {
            return;
        }
        setSelectedWorkOrder(wo);
        setDetailModalOpen(true);
    };

    const getStatusColor = (esito: string | null) => {
        if (esito === 'OK') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (esito === 'NON OK') return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        if (esito === 'IN CORSO') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'; // Default / Pending
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Pianificazioni di Oggi
                </h3>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-[10px] text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-muted-foreground font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="px-3 py-2 w-[10%]">Work Order</th>
                            <th className="px-3 py-2 w-[15%]">Progetto</th>
                            <th className="px-3 py-2 w-[15%]">Fornitore</th>
                            <th className="px-3 py-2 w-[10%]">Regione</th>
                            <th className="px-3 py-2 w-[15%]">Città</th>
                            <th className="px-3 py-2 w-[10%]">Esito</th>
                            <th className="px-3 py-2 w-[25%]">Note/Motivazione</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    Nessuna pianificazione per oggi.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => {
                                const wo = row.work_orders || {};
                                const fornitore = row.fornitori?.ragione_sociale;
                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                        onClick={(e) => handleRowClick(wo, e)}
                                    >
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                {wo.work_order}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] capitalize" title={wo.progetto}>
                                                {wo.progetto?.toLowerCase() || 'N/D'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <span className="truncate max-w-[150px] capitalize" title={fornitore}>
                                                    {fornitore?.toLowerCase() || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-slate-600 dark:text-slate-400 truncate max-w-[100px] capitalize" title={wo.regione}>
                                                {wo.regione?.toLowerCase() || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="truncate max-w-[150px] capitalize" title={wo.citta}>
                                                    {wo.citta?.toLowerCase() || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div onClick={(e) => e.stopPropagation()} className="stop-propagation">
                                                <select
                                                    className={`text-[10px] font-bold rounded border-0 py-1 pl-2 pr-6 ring-1 ring-inset focus:ring-2 focus:ring-inset cursor-pointer outline-none transition-all shadow-sm ${getStatusColor(row.esito)}`}
                                                    value={row.esito || ''}
                                                    onChange={(e) => handleOutcomeChange(row.id, e.target.value)}
                                                >
                                                    <option value="" disabled className="bg-white text-slate-500">Seleziona...</option>
                                                    <option value="IN CORSO" className="bg-white text-amber-700 dark:bg-slate-800 dark:text-amber-400">IN CORSO</option>
                                                    <option value="OK" className="bg-white text-emerald-700 dark:bg-slate-800 dark:text-emerald-400">OK</option>
                                                    <option value="NON OK" className="bg-white text-rose-700 dark:bg-slate-800 dark:text-rose-400">NON OK</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.esito === 'NON OK' ? (
                                                <div
                                                    className="stop-propagation flex items-center gap-1.5 text-red-700 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded border border-red-100 dark:border-red-900/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors w-fit max-w-full"
                                                    onClick={(e) => { e.stopPropagation(); handleOutcomeChange(row.id, 'NON OK'); }}
                                                    title="Clicca per modificare la motivazione"
                                                >
                                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                                    <span className="text-[9px] font-bold uppercase truncate">{row.motivazione_fallimento || 'Nessuna motivazione'}</span>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-muted-foreground italic truncate max-w-[250px] capitalize" title={row.note_importanti}>
                                                    {row.note_importanti?.toLowerCase() || '-'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Motivazione Fallimento */}
            <Dialog open={motivazioneModalOpen} onOpenChange={setMotivazioneModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Motivazione Fallimento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Seleziona la motivazione per cui l'intervento non è andato a buon fine.
                        </p>
                        <div className="space-y-2">
                            <Label>Motivazione</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                            >
                                <option value="" disabled>Seleziona una causa...</option>
                                {failureReasons.map(r => (
                                    <option key={r.id} value={r.reason}>{r.reason}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setMotivazioneModalOpen(false)}>Annulla</Button>
                        <Button onClick={confirmFailure} disabled={!selectedReason} variant="destructive">
                            Conferma NON OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dettaglio Work Order */}
            {selectedWorkOrder && (
                <WorkOrderDetailModal
                    open={detailModalOpen}
                    onOpenChange={setDetailModalOpen}
                    workOrder={selectedWorkOrder}
                    onUpdate={() => {
                        // Optional: refresh daily table if WO changes (e.g. notes added)
                        // window.location.reload(); // Too drastic
                    }}
                />
            )}
        </div>
    );
}
