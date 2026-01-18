import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

interface AddNoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (note: string) => Promise<void>;
}

export function AddNoteModal({ open, onOpenChange, onSave }: AddNoteModalProps) {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!note.trim()) return;

        try {
            setIsSubmitting(true);
            await onSave(note);
            setNote('');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] z-[60] p-0 overflow-hidden shadow-2xl border-slate-200 dark:border-slate-800">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Nuova Nota</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Aggiungi un aggiornamento o un'osservazione al work order.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4 bg-white dark:bg-slate-950">
                    <div className="space-y-2">
                        <Label htmlFor="note" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Contenuto Nota
                        </Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Scrivi qui i dettagli..."
                            className="min-h-[150px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all font-sans text-sm leading-relaxed"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 mr-2"
                    >
                        Annulla
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!note.trim() || isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium px-6"
                    >
                        {isSubmitting ? 'Salvataggio...' : 'Salva Nota'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>,
        document.body
    );
}
