import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Calendar, MapPin, ClipboardList, Phone, Building2, CheckCircle2, StickyNote } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { WorkOrder } from '../../../services/workOrderService';
import { PlanningManager } from './PlanningManager';
import { projectSettingsService } from '../../../services/projectSettingsService';
import { priceListService } from '../../../services/priceListService';
import { EconomicsManager } from './EconomicsManager';
import { economicsService, type WorkOrderItem } from '../../../services/economicsService';
import { AddNoteModal } from './AddNoteModal';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus } from 'lucide-react';
import { workOrderService } from '../../../services/workOrderService';

interface WorkOrderDetailModalProps {
    workOrder: WorkOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function WorkOrderDetailModal({ workOrder, open, onOpenChange, onUpdate }: WorkOrderDetailModalProps) {
    if (!workOrder) return null;



    const fullAddress = [workOrder.via, workOrder.cap, workOrder.citta, `(${workOrder.provincia})`].filter(Boolean).join(' ');

    const [economicsItems, setEconomicsItems] = useState<WorkOrderItem[]>([]);

    const loadEconomics = async () => {
        try {
            if (workOrder) {
                const data = await economicsService.getByWorkOrder(workOrder.work_order);
                setEconomicsItems(data || []);
            }
        } catch (err) {
            console.error('Failed to load economics', err);
        }
    };

    useEffect(() => {
        if (open && workOrder) {
            loadEconomics();
        }
    }, [open, workOrder]);

    const isReadOnly = ['closed', 'completed', 'chiuso', 'completato', 'terminato', 'chiuso completato'].includes(workOrder.stato?.toLowerCase() || '');

    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    const [internalNotes, setInternalNotes] = useState<string | null>(workOrder.notes);
    const { user } = useAuth();

    const [resolvedPriceListId, setResolvedPriceListId] = useState<string | null>(workOrder?.price_list_id || null);

    // Update internal notes when workOrder prop changes
    useEffect(() => {
        if (workOrder) {
            setInternalNotes(workOrder.notes);
            resolvePriceListContext(workOrder);
        }
    }, [workOrder]);

    const resolvePriceListContext = async (wo: WorkOrder) => {
        // If explicitly set, use it.
        if (wo.price_list_id) {
            setResolvedPriceListId(wo.price_list_id);
            return;
        }

        try {
            // Check project setting
            if (wo.progetto) {
                 const projSet = await projectSettingsService.getSettings(wo.progetto);
                 if (projSet?.client_price_list_id) {
                     setResolvedPriceListId(projSet.client_price_list_id);
                     return;
                 }
            }
            
            // Check global default
            const lists = await priceListService.getUniqueListini();
            const defaultList = lists.find(l => l.is_default && l.type === 'Consuntivo' && l.is_active);
            if (defaultList) {
                setResolvedPriceListId(defaultList.id);
            } else {
                setResolvedPriceListId(null);
            }
        } catch (e) {
            console.error("Error resolving price list:", e);
        }
    };

    // Assuming we don't have user full_name in context freely available in this snippet without fetching profile, 
    // we'll try to find it or fallback to email.
    // For now, let's use email or specific metadata if available. 
    // Improve: We could fetch profile here if needed, but for step simplicity:
    const userName = user?.user_metadata?.full_name || user?.email || 'Utente';

    const handleSaveNote = async (noteText: string) => {
        if (!workOrder) return;

        const timestamp = new Date().toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const formattedNote = `[${timestamp}] - ${userName} - ${noteText}`;
        const newNotes = internalNotes
            ? `${formattedNote}\n\n${internalNotes}` // Prepend new note
            : formattedNote;

        try {
            // Update local state immediately for UI responsiveness
            setInternalNotes(newNotes);

            await workOrderService.update(workOrder.work_order, { notes: newNotes });

            // Trigger parent refresh to ensure persistence
            onUpdate();
        } catch (error) {
            console.error('Failed to save note', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden outline-none">

                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-900">Work Order {workOrder.work_order}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1 text-base">
                                    <MapPin className="h-4 w-4 text-slate-400" /> <span>{workOrder.citta} &bull;</span> <span className="text-slate-500 font-medium">{workOrder.progetto}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm",
                                workOrder.stato === 'New' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    workOrder.stato === 'In Progress' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                        "bg-green-50 text-green-700 border-green-200"
                            )}>
                                {workOrder.stato}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left Column: Registry, Context, Timeline */}
                        <div className="space-y-6 lg:col-span-1">

                            {/* Anagrafica Section */}
                            <section className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" /> Anagrafica
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <div className="p-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mr-2.5 shrink-0 shadow-sm">
                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500 tracking-wide mb-0.5">SOA</p>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{workOrder.soa_code || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="p-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mr-2.5 shrink-0 shadow-sm">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500 tracking-wide mb-0.5">Indirizzo Completo</p>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{fullAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="p-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mr-2.5 shrink-0 shadow-sm">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500 tracking-wide mb-0.5">Regione</p>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{workOrder.regione}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="p-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mr-2.5 shrink-0 shadow-sm">
                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500 tracking-wide mb-0.5">Recapito Telefonico</p>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{workOrder.telefono}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className={cn("p-1.5 rounded-md border border-slate-100 dark:border-slate-800 mr-2.5 shrink-0 shadow-sm bg-white dark:bg-slate-950", workOrder.sede_presidiata ? "text-green-600 border-green-200" : "text-slate-400")}>
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-500 tracking-wide mb-0.5">Presidio</p>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{workOrder.sede_presidiata ? "Sede Presidiata" : "Non Presidiata"}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Timeline Section */}
                            <section className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" /> Timeline
                                </h3>

                                <div className="space-y-0 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                                    {[
                                        { label: 'Avvio Programmato', date: workOrder.avvio_programmato, color: 'blue' },
                                        { label: 'Scadenza Prevista', date: workOrder.fine_prevista, color: 'amber' },
                                        { label: 'Ultimo Aggiornamento', date: workOrder.aggiornato, color: 'slate' },
                                        {
                                            label: 'Chiusura',
                                            date: workOrder.chiuso,
                                            color: workOrder.chiuso && workOrder.fine_prevista && new Date(workOrder.chiuso) > new Date(workOrder.fine_prevista) ? 'red' : 'green'
                                        }
                                    ]
                                        .filter(e => e.date) // Only show existing dates
                                        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                                        .map((event, index) => (
                                            <div key={index} className="relative pb-8 pl-6 last:pb-0">
                                                <div className={cn(
                                                    "absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950",
                                                    event.color === 'blue' ? "bg-blue-500" :
                                                        event.color === 'amber' ? "bg-amber-500" :
                                                            event.color === 'green' ? "bg-green-500" :
                                                                event.color === 'red' ? "bg-red-500" :
                                                                    "bg-slate-300 dark:bg-slate-700"
                                                )} />
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-[10px] font-semibold",
                                                        event.color === 'blue' ? "text-blue-600 dark:text-blue-400" :
                                                            event.color === 'amber' ? "text-amber-600 dark:text-amber-500" :
                                                                event.color === 'green' ? "text-green-600 dark:text-green-500" :
                                                                    event.color === 'red' ? "text-red-600 dark:text-red-500" :
                                                                        "text-slate-500"
                                                    )}>{event.label}</span>
                                                    <span className="text-[11px] font-medium text-slate-900 dark:text-slate-100">
                                                        {new Date(event.date!).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </section>

                        </div>

                        {/* Right Column: Planning, Estimates & Actuals (Expanded Priority) */}
                        <div className="lg:col-span-4 space-y-6">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Description & Technical Context */}
                                <section className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 p-4 h-full">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4 text-primary" /> Dettagli Intervento
                                    </h3>
                                    <div className="text-[11px] leading-5 text-slate-700 dark:text-slate-300 font-sans">
                                        <Label className="text-[10px] text-slate-400 font-semibold mb-1 block">Descrizione Richiesta</Label>
                                        <p className="whitespace-pre-wrap">{workOrder.descrizione || "Nessuna descrizione disponibile."}</p>

                                        {workOrder.breve_descrizione && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                                <Label className="text-[10px] text-slate-400 font-semibold mb-1 block">Oggetto Breve</Label>
                                                <p className="font-medium text-[11px] text-slate-600 dark:text-slate-400">{workOrder.breve_descrizione}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Notes Section */}
                                <section className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 p-4 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <StickyNote className="h-4 w-4 text-primary" /> Note Work Order
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                                            onClick={() => setIsAddNoteOpen(true)}
                                            disabled={isReadOnly}
                                        >
                                            <Plus className="h-4 w-4 text-slate-600" />
                                        </Button>
                                    </div>
                                    <div className="text-[11px] leading-5 text-slate-700 dark:text-slate-300 font-sans flex-1 overflow-y-auto overflow-x-hidden max-h-[200px] bg-white dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 p-2 break-words">
                                        {internalNotes ? (
                                            <p className="whitespace-pre-wrap break-words">{internalNotes}</p>
                                        ) : (
                                            <p className="italic text-slate-400">Nessuna nota presente.</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <AddNoteModal
                                open={isAddNoteOpen}
                                onOpenChange={setIsAddNoteOpen}
                                onSave={handleSaveNote}
                            />

                            {/* Planning Section */}
                            <section>
                                <PlanningManager
                                    workOrderId={workOrder.work_order}
                                    status={workOrder.stato}
                                    onUpdate={() => {
                                        loadEconomics();
                                        onUpdate();
                                    }}
                                />
                            </section>


                            {/* Economics Section */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                                {/* Preventivi Section */}
                                <section>
                                    <EconomicsManager
                                        workOrderId={workOrder.work_order}
                                        type="preventivo"
                                        priceListId={resolvedPriceListId}
                                        items={economicsItems}
                                        onUpdate={loadEconomics}
                                        readOnly={isReadOnly}
                                    />
                                </section>

                                {/* Consuntivi Cliente Section */}
                                <section className="xl:border-l xl:border-r border-slate-100 dark:border-slate-800 xl:px-6">
                                    <EconomicsManager
                                        workOrderId={workOrder.work_order}
                                        type="consuntivo_cliente"
                                        priceListId={resolvedPriceListId} // Same as Preventivo (Client)
                                        items={economicsItems}
                                        onUpdate={loadEconomics}
                                        readOnly={isReadOnly}
                                    />
                                </section>

                                {/* Consuntivi Fornitori Section (Summary Only) */}
                                <section>
                                    <EconomicsManager
                                        workOrderId={workOrder.work_order}
                                        type="consuntivo"
                                        priceListId={null} // Not used in read-only summary
                                        items={economicsItems}
                                        onUpdate={() => { }} // No-op as readonly
                                        readOnly={true} // Always read-only here, managed in Planning
                                    />
                                </section>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 backdrop-blur-sm shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Chiudi Scheda
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
