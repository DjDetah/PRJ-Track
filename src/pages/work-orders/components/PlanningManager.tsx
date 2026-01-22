import { useEffect, useState } from 'react';
import { workOrderService } from '../../../services/workOrderService';
import { supplierService, type Fornitore } from '../../../services/supplierService';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Plus, Trash2, CalendarClock, AlertCircle, Building2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Database } from '../../../types/supabase';
import { Select } from '../../../components/ui/select';
import { EconomicsManager } from './EconomicsManager';
import { economicsService, type WorkOrderItem } from '../../../services/economicsService';
import { priceListService, type PriceList } from '../../../services/priceListService';
import { settingsService, type FailureReason } from '../../../services/settingsService';
import { Badge } from '../../../components/ui/badge';

type Pianificazione = Database['public']['Tables']['pianificazioni']['Row'] & {
    fornitori?: { ragione_sociale: string } | null;
};

interface PlanningManagerProps {
    workOrderId: string;
    status: string;
    onUpdate?: () => void;
}

export function PlanningManager({ workOrderId, status, onUpdate }: PlanningManagerProps) {
    const [plannings, setPlannings] = useState<Pianificazione[]>([]);
    const [suppliers, setSuppliers] = useState<Fornitore[]>([]);
    const [supplierPriceLists, setSupplierPriceLists] = useState<PriceList[]>([]);
    const [failureReasons, setFailureReasons] = useState<FailureReason[]>([]);

    // Modal State
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [date, setDate] = useState('');
    const [noteImportanti, setNoteImportanti] = useState('');
    const [noteChiusura, setNoteChiusura] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>(undefined);
    const [selectedPriceListId, setSelectedPriceListId] = useState<string | undefined>(undefined);

    // Outcome State
    const [esito, setEsito] = useState<'IN CORSO' | 'OK' | 'NON OK' | ''>('');
    const [motivazione, setMotivazione] = useState('');

    // Consuntivi State (for the modal)
    const [planningConsuntivi, setPlanningConsuntivi] = useState<WorkOrderItem[]>([]);

    const [saving, setSaving] = useState(false);

    const normalizedStatus = status?.toLowerCase().trim() || '';
    const isReadOnly = ['closed', 'completed', 'chiuso', 'completato', 'terminato', 'chiuso completato'].includes(normalizedStatus);

    useEffect(() => {
        loadPlannings();
        loadSuppliers();
        loadPriceLists();
        loadFailureReasons();
    }, [workOrderId]);

    const loadPlannings = async () => {
        try {
            const data = await workOrderService.getPianificazioni(workOrderId);
            setPlannings(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadSuppliers = async () => {
        try {
            const data = await supplierService.getAll();
            setSuppliers(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadPriceLists = async () => {
        try {
            const lists = await priceListService.getUniqueListini();
            setSupplierPriceLists(lists.filter(l => l.type === 'Fornitore') as any[]);
        } catch (err) {
            console.error(err);
        }
    };

    const loadFailureReasons = async () => {
        try {
            const data = await settingsService.getActiveFailureReasons();
            setFailureReasons(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadPlanningConsuntivi = async (planningId: string) => {
        try {
            const data = await economicsService.getByPlanning(planningId);
            setPlanningConsuntivi(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRowClick = (planning: Pianificazione) => {
        setSelectedId(planning.id);
        if (planning.data_pianificazione) {
            const d = new Date(planning.data_pianificazione);
            const formattedDate = d.toISOString().slice(0, 16);
            setDate(formattedDate);
        } else {
            setDate('');
        }

        setNoteImportanti(planning.note_importanti || '');
        setNoteChiusura(planning.note_chiusura || '');
        setSelectedSupplierId(planning.fornitore_id || undefined);
        setSelectedPriceListId(planning.price_list_id || undefined);
        setEsito(planning.esito || '');
        setMotivazione(planning.motivazione_fallimento || '');

        loadPlanningConsuntivi(planning.id);
        setOpen(true);
    };

    const handleSave = async () => {
        // Validation: require either date or supplier
        if (!date && !selectedSupplierId) return;

        // Validation: Non OK requires reason
        if (esito === 'NON OK' && !motivazione) return;

        setSaving(true);
        try {
            const isoString = date ? new Date(date).toISOString() : null;

            const payload = {
                date: isoString,
                noteImportanti: noteImportanti || undefined,
                noteChiusura: noteChiusura || undefined,
                fornitoreId: selectedSupplierId,
                priceListId: selectedPriceListId,
                esito: esito || undefined,
                motivazioneFallimento: (esito === 'NON OK' ? motivazione : null) || undefined
            };

            if (selectedId) {
                await workOrderService.updatePianificazione(selectedId, payload);
            } else {
                await workOrderService.addPianificazione({
                    workOrderId,
                    ...payload
                });
            }

            setOpen(false);
            resetForm();
            loadPlannings();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Failed to save planning', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        try {
            await workOrderService.deletePianificazione(id);
            setPlannings(prev => prev.filter(p => p.id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const resetForm = () => {
        setSelectedId(null);
        setDate('');
        setNoteImportanti('');
        setNoteChiusura('');
        setSelectedSupplierId(undefined);
        setSelectedPriceListId(undefined);
        setEsito('');
        setMotivazione('');
        setPlanningConsuntivi([]);
    };

    const getEsitoBadge = (esito: string | null) => {
        switch (esito) {
            case 'OK': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> OK</Badge>;
            case 'NON OK': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> KO</Badge>;
            case 'IN CORSO': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200"><Clock className="w-3 h-3 mr-1" /> In Corso</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Elenco Pianificazioni
                </h3>
                {!isReadOnly && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-left">
                        <tr>
                            <th className="p-2 font-medium text-muted-foreground w-1/4">Data</th>
                            <th className="p-2 font-medium text-muted-foreground w-1/4">Fornitore</th>
                            <th className="p-2 font-medium text-muted-foreground w-1/6">Esito</th>
                            <th className="p-2 font-medium text-muted-foreground">Note</th>
                            <th className="p-2 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {plannings.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground italic">
                                    Nessuna pianificazione inserita.
                                </td>
                            </tr>
                        ) : (
                            plannings.map(p => (
                                <tr
                                    key={p.id}
                                    className="group hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(p)}
                                >
                                    <td className="p-2 font-medium align-top">
                                        {p.data_pianificazione ? new Date(p.data_pianificazione).toLocaleString('it-IT', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }) : <span className="text-slate-400 italic">Non pianificato</span>}
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                        {p.fornitori?.ragione_sociale ? (
                                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                                <Building2 className="h-3 w-3 text-slate-400" />
                                                {p.fornitori.ragione_sociale}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-2 align-top">
                                        <div className="flex flex-col gap-1 items-start">
                                            {getEsitoBadge(p.esito)}
                                            {p.esito === 'NON OK' && p.motivazione_fallimento && (
                                                <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                    {p.motivazione_fallimento}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                        {(p.note_importanti || p.note_chiusura) ? (
                                            <div className="space-y-1">
                                                {p.note_importanti && (
                                                    <div className="flex gap-1 text-amber-600 dark:text-amber-500">
                                                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                        <span>{p.note_importanti}</span>
                                                    </div>
                                                )}
                                                {p.note_chiusura && (
                                                    <div className="text-slate-500">
                                                        <span className="font-semibold">Chiusura:</span> {p.note_chiusura}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-right align-top">
                                        {!isReadOnly && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDelete(p.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={open} onOpenChange={(val) => {
                if (!val) {
                    resetForm();
                    if (onUpdate) onUpdate();
                }
                setOpen(val);
            }}>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden gap-0 max-h-[85vh] flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <DialogTitle className="text-lg">
                            {selectedId ? "Dettagli Pianificazione" : "Nuova Pianificazione"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedId ? "Visualizza o modifica i dettagli della pianificazione." : "Inserisci i dettagli per la nuova pianificazione tecnica."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Date & Supplier */}
                            <div className="space-y-6">
                                <fieldset disabled={isReadOnly} className="space-y-6 group-disabled:opacity-50">
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Data Pianificazione
                                        </Label>
                                        <Input
                                            id="date"
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="font-mono disabled:opacity-50 h-10"
                                            disabled={isReadOnly}
                                        />
                                        <p className="text-[10px] text-muted-foreground">Obbligatoria per gestire i consuntivi</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="supplier" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Fornitore Incaricato
                                        </Label>
                                        <Select
                                            id="supplier"
                                            value={selectedSupplierId || ''}
                                            onChange={(e) => setSelectedSupplierId(e.target.value || undefined)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="">Seleziona Fornitore</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.ragione_sociale}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priceList" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Listino Fornitore (Costi)
                                        </Label>
                                        <Select
                                            id="priceList"
                                            value={selectedPriceListId || ''}
                                            onChange={(e) => setSelectedPriceListId(e.target.value || undefined)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="">Seleziona Listino...</option>
                                            {supplierPriceLists.map(pl => (
                                                <option key={pl.id} value={pl.id}>
                                                    {pl.name}
                                                </option>
                                            ))}
                                        </Select>
                                        {!selectedPriceListId && (
                                            <p className="text-[10px] text-amber-600">
                                                Necessario per inserire Consuntivi.
                                            </p>
                                        )}
                                    </div>
                                </fieldset>
                            </div>

                            {/* Right Column: Outcomes & Notes */}
                            <div className="space-y-6">
                                <fieldset disabled={isReadOnly} className="space-y-6 group-disabled:opacity-50">

                                    {/* Outcome Section */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <Label htmlFor="esito" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Esito Intervento
                                            </Label>
                                            <Select
                                                id="esito"
                                                value={esito}
                                                onChange={(e) => {
                                                    const val = e.target.value as any;
                                                    setEsito(val);
                                                    if (val !== 'NON OK') setMotivazione('');
                                                }}
                                                disabled={isReadOnly}
                                            >
                                                <option value="">- Non Definito -</option>
                                                <option value="IN CORSO">In Corso</option>
                                                <option value="OK">OK - Completato</option>
                                                <option value="NON OK">NON OK - Fallito</option>
                                            </Select>
                                        </div>

                                        {esito === 'NON OK' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="motivazione" className="text-xs font-semibold uppercase tracking-wider text-red-500">
                                                    Motivazione Fallimento
                                                </Label>
                                                <Select
                                                    id="motivazione"
                                                    value={motivazione}
                                                    onChange={(e) => setMotivazione(e.target.value)}
                                                    disabled={isReadOnly}
                                                    className="border-red-200 focus:ring-red-500"
                                                >
                                                    <option value="">Seleziona Causa...</option>
                                                    {failureReasons.map(r => (
                                                        <option key={r.id} value={r.reason}>
                                                            {r.reason}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="note" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Note Importanti
                                        </Label>
                                        <Textarea
                                            id="note"
                                            placeholder="Inserisci informazioni critiche per l'intervento..."
                                            value={noteImportanti}
                                            onChange={(e) => setNoteImportanti(e.target.value)}
                                            className="min-h-[80px] resize-none disabled:opacity-50"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="chiusura" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Note Chiusura
                                        </Label>
                                        <Textarea
                                            id="chiusura"
                                            placeholder="Eventuali note relative alla chiusura prevista..."
                                            value={noteChiusura}
                                            onChange={(e) => setNoteChiusura(e.target.value)}
                                            className="min-h-[80px] resize-none disabled:opacity-50"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </fieldset>
                            </div>
                        </div>

                        {selectedId && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                {(selectedPriceListId && date) ? (
                                    <EconomicsManager
                                        workOrderId={workOrderId}
                                        type="consuntivo"
                                        priceListId={selectedPriceListId}
                                        pianificazioneId={selectedId}
                                        items={planningConsuntivi}
                                        onUpdate={() => loadPlanningConsuntivi(selectedId)}
                                        readOnly={isReadOnly}
                                    />
                                ) : (
                                    <div className="p-4 border border-dashed border-amber-200 bg-amber-50 rounded text-amber-800 text-sm text-center flex flex-col items-center gap-1">
                                        <span>Per gestire i consuntivi è necessario:</span>
                                        <div className="flex gap-4 text-xs font-bold">
                                            <span className={date ? "text-green-600 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                                                {date ? "✓ Data Inserita" : "✕ Data Mancante"}
                                            </span>
                                            <span className={selectedPriceListId ? "text-green-600 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                                                {selectedPriceListId ? "✓ Listino Selezionato" : "✕ Listino Mancante"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-2 shrink-0">
                        <Button variant="outline" onClick={() => setOpen(false)}>Chiudi</Button>
                        {!isReadOnly && (
                            <Button
                                onClick={handleSave}
                                disabled={
                                    (!date && !selectedSupplierId) ||
                                    saving ||
                                    (esito === 'NON OK' && !motivazione)
                                }
                            >
                                {saving ? "Salvataggio..." : "Salva Pianificazione"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
