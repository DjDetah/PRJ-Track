import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';

interface ListinoImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (name: string, type: 'Consuntivo' | 'Fornitore') => void;
}

export function ListinoImportModal({ open, onOpenChange, onConfirm }: ListinoImportModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Consuntivo' | 'Fornitore' | ''>('');

    const handleSubmit = () => {
        if (name && type) {
            onConfirm(name, type);
            setName('');
            setType('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-6 gap-6">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-bold tracking-tight">Importa Nuovo Listino</DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Definisci la tipologia e il nome del listino prezzi che stai per importare.
                        I codici verranno associati a questo listino.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-2">
                    <div className="grid gap-3">
                        <Label htmlFor="name" className="text-base font-medium text-foreground">
                            Nome del Listino
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Es. Listino Generale 2024"
                            className="h-12 text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                            Nome identificativo univoco per questo listino.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="type" className="text-base font-medium text-foreground">
                            Tipologia
                        </Label>
                        <Select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'Consuntivo' | 'Fornitore')}
                            className="h-12 text-base w-full"
                        >
                            <option value="" disabled className="text-muted-foreground">Seleziona la tipologia...</option>
                            <option value="Consuntivo">Consuntivo (Listino di Vendita al Cliente)</option>
                            <option value="Fornitore">Fornitore (Listino Costi di Acquisto)</option>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Indica se i prezzi si riferiscono a quanto fatturato al cliente o ai costi dei fornitori.
                        </p>
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" size="lg" onClick={() => onOpenChange(false)} className="h-11">
                        Annulla
                    </Button>
                    <Button size="lg" onClick={handleSubmit} disabled={!name || !type} className="h-11 min-w-[150px]">
                        Procedi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
