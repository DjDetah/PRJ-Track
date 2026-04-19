import { useState, useEffect } from 'react';
import { clientiService, type Cliente } from '../../services/clientiService';
import { Button } from '../ui/button';
import { Building2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/dialog';

interface Props {
    profileId: string;
    userName: string;
}

export function UserClientManager({ profileId, userName }: Props) {
    const [open, setOpen] = useState(false);
    const [globalClienti, setGlobalClienti] = useState<Cliente[]>([]);
    const [assignedClienti, setAssignedClienti] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allC = await clientiService.getAllClienti();
            const userC = await clientiService.getClientiForUser(profileId);
            setGlobalClienti(allC);
            setAssignedClienti(userC.map(c => c.id));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignment = (clientId: string) => {
        setAssignedClienti(prev => 
            prev.includes(clientId) 
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSave = async () => {
        try {
            await clientiService.assignClientiToUser(profileId, assignedClienti);
            setOpen(false);
        } catch (error) {
            alert("Errore durante l'assegnazione: " + error);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs h-8">
                <Building2 className="h-3 w-3 mr-1" />
                Assegna Clienti
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clienti di {userName || 'Utente'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="text-sm text-center text-muted-foreground p-4">Caricamento...</div>
                        ) : globalClienti.length === 0 ? (
                            <div className="text-sm text-center text-muted-foreground p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                                Nessun cliente registrato in anagrafica generale.
                            </div>
                        ) : (
                            globalClienti.map(cliente => {
                                const isAssigned = assignedClienti.includes(cliente.id);
                                return (
                                    <div 
                                        key={cliente.id} 
                                        onClick={() => toggleAssignment(cliente.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            isAssigned 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div 
                                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                                                isAssigned ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-slate-300'
                                            }`}
                                        >
                                            {isAssigned && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cliente.colore_hex }}></div>
                                        <span className="font-medium text-sm flex-1 truncate">{cliente.nome_cliente}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
                        <Button onClick={handleSave} disabled={loading}>Salva Assegnazioni</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
