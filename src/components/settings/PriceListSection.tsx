import { useEffect, useState } from 'react';
import { priceListService } from '../../services/priceListService';
// Imports removed (unused)
import { Switch } from '../../components/ui/switch';
import { ScrollText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { EditPriceListModal } from './EditPriceListModal';
import { useClient } from '../../contexts/ClientContext';

interface PriceListHeader {
    id: string;
    name: string;
    type: 'Consuntivo' | 'Fornitore';
    is_default: boolean;
    is_active: boolean;
    created_at: string;
}

export function PriceListSection() {
    const { activeCliente } = useClient();
    const [listini, setListini] = useState<PriceListHeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [editingListino, setEditingListino] = useState<PriceListHeader | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await priceListService.getUniqueListini(activeCliente?.id);
            setListini(data as unknown as PriceListHeader[]);
        } catch (err: any) {
            console.error(err);
            setErrorMsg('Errore nel caricamento dei listini.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeCliente) {
            loadData();
        } else {
            setListini([]);
            setLoading(false);
        }
    }, [activeCliente?.id]);

    const handleSetDefault = async (id: string, type: 'Consuntivo' | 'Fornitore', currentVal: boolean) => {
        if (currentVal) return;

        try {
            await priceListService.setAsDefault(id, type, activeCliente?.id);
            await loadData();
        } catch (err: any) {
            console.error(err);
            setErrorMsg('Errore nell\'impostazione del default: ' + err.message);
        }
    };

    return (
        <>
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-indigo-500" />
                        Gestione Listini
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Visualizza e configura i listini prezzi per Clienti e Fornitori. Clicca su un listino per modificarlo.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errore</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-muted-foreground font-medium border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Nome Listino</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Data Importazione</th>
                            <th className="px-4 py-3 text-right">Default</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Caricamento...
                                </td>
                            </tr>
                        ) : listini.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nessun listino presente. Importane uno dalla sezione Import.
                                </td>
                            </tr>
                        ) : (
                            listini.map((l) => (
                                <tr 
                                    key={l.id} 
                                    className={`transition-colors cursor-pointer ${l.is_active === false ? 'bg-slate-100 dark:bg-slate-800/20 text-slate-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    onClick={(e) => {
                                        // Previeni l'apertura del modale se click sullo switch
                                        if ((e.target as HTMLElement).closest('.switch-container')) return;
                                        setEditingListino(l);
                                    }}
                                >
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <span className={l.is_active === false ? 'opacity-60' : 'text-slate-800 dark:text-slate-200'}>{l.name}</span>
                                        {l.is_active === false && (
                                            <Badge variant="outline" className="text-xs bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none">
                                                Disattivato
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={l.type === 'Consuntivo' ? 'default' : 'secondary'} className={l.is_active === false ? 'opacity-60' : ''}>
                                            {l.type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs opacity-80">{new Date(l.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end items-center gap-2 switch-container" onClick={(e) => e.stopPropagation()}>
                                            <Switch
                                                checked={l.is_default}
                                                onCheckedChange={(checked) => handleSetDefault(l.id, l.type, !checked)}
                                                disabled={l.is_default || l.is_active === false}
                                                className="scale-75 origin-right"
                                            />
                                            {l.is_default ? (
                                                <span className="text-xs text-green-600 font-medium whitespace-nowrap">Principale</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground whitespace-nowrap w-16 invisible">&nbsp;</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
        
        <EditPriceListModal
            open={!!editingListino}
            onOpenChange={(open) => !open && setEditingListino(null)}
            listino={editingListino}
            onSaved={loadData}
        />
        </>
    );
}
