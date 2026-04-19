import { useState, useEffect } from 'react';
import { clientiService, type Cliente } from '../../services/clientiService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Building2, Trash2, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/dialog';

export function ClientiSection() {
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);

    const loadClienti = async () => {
        setLoading(true);
        try {
            const data = await clientiService.getAllClienti();
            setClienti(data);
        } catch (error) {
            console.error('Failed to load clienti', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClienti();
    }, []);

    const handleSave = async () => {
        if (!editingCliente?.nome_cliente?.trim()) return;
        try {
            await clientiService.upsertCliente({
                ...editingCliente,
                nome_cliente: editingCliente.nome_cliente.trim(),
                colore_hex: editingCliente.colore_hex || '#0f172a'
            });
            setEditingCliente(null);
            loadClienti();
        } catch (error) {
            console.error("Save error", error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare il cliente "${name}"? Questa operazione ha effetto su progetti e work orders correlati.`)) return;
        try {
            await clientiService.deleteCliente(id);
            loadClienti();
        } catch (error) {
            console.error(error);
            alert("Errore durante l'eliminazione del cliente.");
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-500" />
                        Gestione Anagrafica Clienti
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Definisci i clienti aziendali in modo da separare i dati (multi-tenant app).
                    </p>
                </div>
                <Button onClick={() => setEditingCliente({ nome_cliente: '', colore_hex: '#0f172a' })} className="shrink-0 gap-2">
                    <Plus className="h-4 w-4" /> Nuovo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">Caricamento clienti...</div>
                ) : clienti.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground bg-white dark:bg-slate-900 rounded-lg border border-dashed">
                        Nessun cliente registrato. Creane uno per iniziare.
                    </div>
                ) : (
                    clienti.map(cliente => (
                        <div key={cliente.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                           {/* Color stripe */}
                           <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: cliente.colore_hex }}></div>
                           
                           <div className="flex items-start justify-between">
                               <div>
                                   <h3 className="font-bold text-slate-900 dark:text-slate-100">{cliente.nome_cliente}</h3>
                                   <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cliente.colore_hex }}></div>
                                      {cliente.colore_hex}
                                   </span>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id, cliente.nome_cliente)} className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4" />
                               </Button>
                           </div>

                           <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                               <Button variant="outline" size="sm" onClick={() => setEditingCliente(cliente)}>
                                   Modifica
                               </Button>
                           </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={!!editingCliente} onOpenChange={(o) => !o && setEditingCliente(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCliente?.id ? 'Modifica Cliente' : 'Crea Nuovo Cliente'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome Cliente</Label>
                            <Input 
                                value={editingCliente?.nome_cliente || ''} 
                                onChange={e => setEditingCliente(prev => ({ ...prev, nome_cliente: e.target.value }))}
                                placeholder="Es: Cliente Top Spa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Colore Tematico (HEX)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="color" 
                                    value={editingCliente?.colore_hex || '#0f172a'} 
                                    onChange={e => setEditingCliente(prev => ({ ...prev, colore_hex: e.target.value }))}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input 
                                    type="text" 
                                    value={editingCliente?.colore_hex || '#0f172a'} 
                                    onChange={e => setEditingCliente(prev => ({ ...prev, colore_hex: e.target.value }))}
                                    className="flex-1 font-mono uppercase"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCliente(null)}>Annulla</Button>
                        <Button onClick={handleSave} disabled={!editingCliente?.nome_cliente}>Salva Cliente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </section>
    );
}
