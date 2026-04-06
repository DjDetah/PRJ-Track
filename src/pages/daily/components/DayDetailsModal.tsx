import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../utils/cn';
import { WorkOrderDetailModal } from '../../work-orders/components/WorkOrderDetailModal';
import { workOrderService, type WorkOrder } from '../../../services/workOrderService';
import { Loader2 } from 'lucide-react';

interface DayDetailsModalProps {
    date: string | null;
    items: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DayDetailsModal({ date, items, open, onOpenChange }: DayDetailsModalProps) {
    const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);
    const [loadingWoId, setLoadingWoId] = useState<string | null>(null);

    const handleRowClick = async (woId: string) => {
        if (!woId) return;
        setLoadingWoId(woId);
        try {
            const data = await workOrderService.getById(woId);
            setSelectedWo(data as WorkOrder);
        } catch (error) {
            console.error("Failed to fetch WO details", error);
        } finally {
            setLoadingWoId(null);
        }
    };

    // Render regardless of date, the inner Dialog won't show if open is false anyway.
    if (!date && !open) return null;

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden outline-none">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        Pianificazioni del {date}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950">
                    {items.length === 0 ? (
                        <p className="text-sm text-center text-slate-500 py-8">Vedi tutte le pianificazioni mensili tramite il calendario principale.</p>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Work Order</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Progetto</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Piano Operativo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item, index) => {
                                        const wo = item.work_orders || {};
                                        return (
                                            <tr 
                                                key={index} 
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group relative"
                                                onClick={() => handleRowClick(wo.work_order)}
                                            >
                                                <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-2">
                                                    {loadingWoId === wo.work_order && <Loader2 className="h-3 w-3 animate-spin"/>}
                                                    {wo.work_order || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                                                    {wo.progetto || 'Senza Progetto'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border",
                                                        !wo.gestione || wo.gestione === 'Da Assegnare' ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                                                            wo.gestione === 'Da Pianificare' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" :
                                                                wo.gestione === 'Pianificato' ? "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800" :
                                                                    wo.gestione === 'In Corso' ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" :
                                                                        wo.gestione === 'Completato' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                                                            wo.gestione === 'Da Ripianificare' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" :
                                                                                "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                    )}>
                                                        {wo.gestione || 'Da Assegnare'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {selectedWo && (
            <WorkOrderDetailModal
                workOrder={selectedWo}
                open={!!selectedWo}
                onOpenChange={(o) => (!o && setSelectedWo(null))}
                onUpdate={() => {}}
            />
        )}
        </>
    );
}
