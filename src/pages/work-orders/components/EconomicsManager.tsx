import { useState, useMemo } from 'react';
import { economicsService, type WorkOrderItem, type ListinoItem } from '../../../services/economicsService';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Trash2, Plus, ChevronDown, ChevronUp, Euro } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';

interface EconomicsManagerProps {
    workOrderId: string;
    type: 'preventivo' | 'consuntivo' | 'consuntivo_cliente';
    priceListId: string | null; // Needed to fetch available items
    items: WorkOrderItem[]; // Parent passes items to avoid double fetching
    onUpdate: () => void; // Trigger refresh in parent
    readOnly?: boolean;
    pianificazioneId?: string; // Optional: Link to a specific planning
}

export function EconomicsManager({ workOrderId, type, priceListId, items, onUpdate, readOnly, pianificazioneId }: EconomicsManagerProps) {
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState<ListinoItem[]>([]);
    const [loadingListino, setLoadingListino] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [importing, setImporting] = useState(false);
    const [copying, setCopying] = useState(false);

    // Derived state
    const filteredItems = useMemo(() => {
        const rawItems = items.filter(i => i.type === type);

        if (readOnly) {
            // Aggregate by code
            const aggregated = rawItems.reduce((acc, curr) => {
                const code = curr.codice_attivita?.trim() || 'NO_CODE';
                if (!acc[code]) {
                    acc[code] = {
                        ...curr,
                        quantity: 0,
                        total_price: 0,
                        id: `agg-${code}` // Fake ID for key
                    };
                }
                const currentTotal = curr.total_price ?? (curr.unit_price * curr.quantity);
                acc[code].quantity += curr.quantity;
                acc[code].total_price = (acc[code].total_price || 0) + currentTotal;
                return acc;
            }, {} as Record<string, WorkOrderItem>);

            return Object.values(aggregated).sort((a, b) =>
                (a.codice_attivita || '').localeCompare(b.codice_attivita || '')
            );
        }

        return rawItems.sort((a, b) =>
            (a.codice_attivita || '').localeCompare(b.codice_attivita || '')
        );
    }, [items, type, readOnly]);

    const totalAmount = filteredItems.reduce((acc, curr) => acc + (curr.total_price ?? (curr.unit_price * curr.quantity)), 0);


    const handleOpenAdd = async () => {
        if (!priceListId) {
            alert('Nessun listino associato.');
            return;
        }
        setAddItemOpen(true);
        setLoadingListino(true);
        try {
            const data = await economicsService.getAvailableItems(priceListId);
            setAvailableItems(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingListino(false);
        }
    };

    const handleImportClick = () => {
        document.getElementById(`consuntivo-import-${type}`)?.click();
    };

    const handleCopyPreventivo = async () => {
        if (!confirm('Vuoi copiare tutte le voci dal Preventivo?')) return;
        setCopying(true);
        try {
            if (priceListId) {
                const res = await economicsService.copyFromPreventivo(workOrderId, priceListId);
                alert(`Copiati ${res.count} elementi.`);
                onUpdate();
            }
        } catch (err: any) {
            alert('Errore copia: ' + err.message);
        } finally {
            setCopying(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !priceListId) return;

        // Validation for Consuntivo
        if (type === 'consuntivo' && !pianificazioneId) return;

        setImporting(true);
        try {
            let res;
            if (type === 'consuntivo' && pianificazioneId) {
                res = await economicsService.importConsuntivi(file, workOrderId, pianificazioneId, priceListId);

            } else if (type === 'preventivo' || type === 'consuntivo_cliente') {
                res = await economicsService.importItems(file, workOrderId, type as any, priceListId);
            }

            if (res) {
                alert(`Importazione completata: ${res.imported} voci inserite, ${res.errors} non trovate.`);
                onUpdate();
                setAddItemOpen(false);
            }
        } catch (err: any) {
            console.error(err);
            alert('Errore durante l\'importazione: ' + err.message);
        } finally {
            setImporting(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleAddItem = async (listinoItem: ListinoItem) => {
        try {
            await economicsService.add({
                work_order_id: workOrderId,
                type: type as any,
                price_list_item_id: listinoItem.id,
                pianificazione_id: pianificazioneId, // Link if provided
                codice_attivita: listinoItem.codice,
                descrizione: listinoItem.descrizione,
                unit_price: listinoItem.importo,
                quantity: 1
            });
            onUpdate();
            setAddItemOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa voce?')) return;
        try {
            await economicsService.delete(id);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateQuantity = async (id: string, newQty: number) => {
        if (newQty < 1) return;
        try {
            await economicsService.update(id, { quantity: newQty });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    // Filter available items based on search
    const listinoFiltered = useMemo(() => {
        if (!searchTerm) return availableItems;
        const lower = searchTerm.toLowerCase();
        return availableItems.filter(i =>
            i.codice.toLowerCase().includes(lower) ||
            i.descrizione.toLowerCase().includes(lower)
        );
    }, [availableItems, searchTerm]);

    const getTitle = () => {
        switch (type) {
            case 'preventivo': return 'Preventivo Cliente';
            case 'consuntivo': return 'Consuntivo Fornitori';
            case 'consuntivo_cliente': return 'Consuntivo Finale';
            default: return 'Economica';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                    <Euro className="h-4 w-4 text-primary" />
                    {getTitle()}
                </h3>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                        Tot: € {totalAmount.toFixed(2)}
                    </Badge>
                    {!readOnly && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleOpenAdd}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="p-1.5 text-left font-medium text-muted-foreground">Attività</th>
                            <th className="p-1.5 text-right font-medium text-muted-foreground w-[60px]">Q.tà</th>
                            <th className="p-1.5 text-right font-medium text-muted-foreground w-[80px]">Totale</th>
                            {!readOnly && <th className="p-1.5 w-[30px]"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                                    Nessuna voce inserita.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900">
                                    <td className="p-1.5">
                                        <div className="font-mono font-bold">{item.codice_attivita}</div>
                                        <div className="text-[10px] text-muted-foreground line-clamp-1">{item.descrizione}</div>
                                    </td>
                                    <td className="p-1.5 text-right">
                                        {!readOnly && type !== 'preventivo' ? (
                                            <div className="flex items-center justify-end gap-0.5">
                                                <button
                                                    className="p-0.5 hover:bg-slate-200 rounded"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>
                                                <span className="w-4 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    className="p-0.5 hover:bg-slate-200 rounded"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-medium">{item.quantity}</span>
                                        )}
                                    </td>
                                    <td className="p-1.5 text-right font-mono">
                                        € {(item.total_price ?? (item.unit_price * item.quantity)).toFixed(2)}
                                    </td>
                                    {!readOnly && (
                                        <td className="p-1.5 text-right">
                                            <button
                                                className="text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Item Modal */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <DialogTitle>Aggiungi Voce - {getTitle()}</DialogTitle>
                            {(type === 'preventivo' || type === 'consuntivo_cliente' || (type === 'consuntivo' && pianificazioneId)) && (
                                <div>
                                    <input
                                        type="file"
                                        id={`consuntivo-import-${type}`}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex gap-2">
                                        {type === 'consuntivo_cliente' && filteredItems.length === 0 && (
                                            <Button size="sm" variant="secondary" onClick={handleCopyPreventivo} disabled={copying}>
                                                {copying ? "..." : "Copia da Preventivo"}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={handleImportClick} disabled={importing}>
                                            {importing ? "Importazione..." : "Importa Excel"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <Input
                            placeholder="Cerca per codice o descrizione..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="border border-slate-200 rounded-md h-[400px] overflow-y-auto">
                            {loadingListino ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Caricamento listino...</div>
                            ) : availableItems.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Nessuna voce nel listino associato.</div>
                            ) : listinoFiltered.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Nessun risultato per la ricerca.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="p-2 font-medium">Codice</th>
                                            <th className="p-2 font-medium">Descrizione</th>
                                            <th className="p-2 font-medium text-right">Importo</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {listinoFiltered.map(li => (
                                            <tr key={li.id} className="hover:bg-slate-50">
                                                <td className="p-2 font-mono text-xs font-bold">{li.codice}</td>
                                                <td className="p-2 text-xs">{li.descrizione}</td>
                                                <td className="p-2 text-right font-mono text-xs">€ {li.importo}</td>
                                                <td className="p-2 text-right">
                                                    <Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => handleAddItem(li)}>
                                                        Aggiungi
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
