import { useState, useEffect } from 'react';
import { settingsService, type FailureReason } from '../../services/settingsService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../../components/ui/dialog';

export function SettingsPage() {
    const [reasons, setReasons] = useState<FailureReason[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReason, setNewReason] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadReasons();
    }, []);

    const loadReasons = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getAllFailureReasons();
            setReasons(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newReason.trim()) return;
        setSaving(true);
        try {
            await settingsService.addFailureReason(newReason.toUpperCase().trim());
            await loadReasons();
            setOpenModal(false);
            setNewReason('');
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string, currentState: boolean) => {
        try {
            await settingsService.toggleFailureReason(id, currentState);
            // Optimistic update
            setReasons(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentState } : r));
        } catch (err) {
            console.error(err);
            loadReasons(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare definitivamente questa motivazione?')) return;
        try {
            await settingsService.deleteFailureReason(id);
            setReasons(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Impossible to delete, likely used in records', err);
            alert('Impossibile eliminare: la motivazione è probabilmente usata in alcune pianificazioni. Disabilitala invece.');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Impostazioni
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configura i parametri globali dell'applicazione.
                    </p>
                </div>
            </header>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Motivazioni "Esito NON OK"
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gestisci l'elenco delle cause di mancato intervento.
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Nuova Motivazione
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-muted-foreground font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-2 w-2/3 text-xs uppercase tracking-wider">Motivazione</th>
                                <th className="px-4 py-2 text-xs uppercase tracking-wider">Stato</th>
                                <th className="px-4 py-2 text-right text-xs uppercase tracking-wider">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={3} className="p-4 text-center text-xs">Caricamento...</td></tr>
                            ) : reasons.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                                        {r.reason}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={r.is_active}
                                                onCheckedChange={() => handleToggle(r.id, r.is_active)}
                                                className="scale-75 origin-left"
                                            />
                                            <span className={`text-[10px] uppercase font-bold ${r.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                                                {r.is_active ? 'Attivo' : 'Disabilitato'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(r.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    style={{ width: '600px', maxWidth: '90vw' }}
                >
                    <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Nuova Motivazione
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                                Descrizione Motivazione
                            </Label>
                            <Input
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                placeholder="ES: MALTEMPO"
                                className="font-mono uppercase"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd();
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Sarà convertita automaticamente in maiuscolo. Deve essere univoca.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <Button variant="ghost" onClick={() => setOpenModal(false)}>Annulla</Button>
                        <Button onClick={handleAdd} disabled={!newReason.trim() || saving}>
                            {saving ? 'Salvataggio...' : 'Aggiungi Motivazione'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
