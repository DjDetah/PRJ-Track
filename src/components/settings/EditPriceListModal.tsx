import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { priceListService } from '../../services/priceListService';

export interface PriceListHeader {
    id: string;
    name: string;
    type: 'Consuntivo' | 'Fornitore';
    is_default: boolean;
    is_active: boolean; // Now active state is supported
    created_at: string;
}

interface EditPriceListModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listino: PriceListHeader | null;
    onSaved: () => void;
}

export function EditPriceListModal({ open, onOpenChange, listino, onSaved }: EditPriceListModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Consuntivo' | 'Fornitore'>('Consuntivo');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (listino && open) {
            setName(listino.name);
            setType(listino.type);
            setIsActive(listino.is_active ?? true); // Default to true if undefined
            setError(null);
        }
    }, [listino, open]);

    const handleSave = async () => {
        if (!listino) return;
        if (!name.trim()) {
            setError('Il nome non può essere vuoto.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await priceListService.updateListino(listino.id, {
                name: name.trim(),
                type: type,
                is_active: isActive
            });
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message || 'Si è verificato un errore durante il salvataggio.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifica Listino</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome Listino</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Es: Listino 2024"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipologia</Label>
                        <Select value={type} onChange={(e) => setType(e.target.value as 'Consuntivo' | 'Fornitore')}>
                            <option value="Consuntivo">Consuntivo (Cliente)</option>
                            <option value="Fornitore">Fornitore</option>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t">
                        <div className="flex flex-col">
                            <Label className="text-sm font-medium">Stato di Attivazione</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Disattivando il listino, non sarà più selezionabile per nuovi Work Orders.
                            </p>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Annulla
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvataggio...' : 'Salva'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
