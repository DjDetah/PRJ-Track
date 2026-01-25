// ... (Top of file imports)
import { useState, useEffect } from 'react';
import { settingsService, type FailureReason } from '../../services/settingsService';
import { userService, type UserProfile, type UserRole } from '../../services/userService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Select } from "../../components/ui/select"
import { Plus, Trash2, AlertTriangle, Users, Search } from 'lucide-react';
// ... imports
import { PriceListSection } from '../../components/settings/PriceListSection';
import { ImportSection } from '../../components/settings/ImportSection';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../../components/ui/dialog';

export function SettingsPage() {
    // --- State Definition ---
    const [reasons, setReasons] = useState<FailureReason[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReason, setNewReason] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // User Management State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userSearch, setUserSearch] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    useEffect(() => {
        loadReasons();
        loadUsers();
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

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await userService.getAll();
            setUsers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsers(false);
        }
    };

    // --- Handlers ---
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
            setReasons(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentState } : r));
        } catch (err) {
            console.error(err);
            loadReasons();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare definitivamente questa motivazione?')) return;
        try {
            await settingsService.deleteFailureReason(id);
            setReasons(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
            alert('Impossibile eliminare: la motivazione è probabilmente usata in alcune pianificazioni.');
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            await userService.updateRole(userId, newRole);
        } catch (err) {
            console.error(err);
            alert('Errore durante l\'aggiornamento del ruolo.');
            loadUsers();
        }
    };

    const startEditingName = (user: UserProfile) => {
        setEditingUserId(user.id);
        setEditNameValue(user.full_name || '');
    };

    const saveName = async (userId: string) => {
        if (!editNameValue.trim()) return;
        try {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, full_name: editNameValue.trim() } : u));
            setEditingUserId(null);
            await userService.updateProfile(userId, { full_name: editNameValue.trim() });
        } catch (err) {
            console.error(err);
            alert("Errore salvataggio: " + JSON.stringify(err, null, 2));
            loadUsers();
        }
    }

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditNameValue('');
    };

    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-8">


            {/* --- User Management Section --- */}
            <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Gestione Utenti
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gestisci gli utenti registrati. Gli utenti devono registrarsi autonomamente.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca utente..."
                                className="pl-8"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-muted-foreground font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3 w-1/3">Utente (Click per modificare)</th>
                                <th className="px-4 py-3 w-1/3">Email</th>
                                <th className="px-4 py-3">Ruolo</th>
                                <th className="px-4 py-3 text-right">Registrato il</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loadingUsers ? (
                                <tr><td colSpan={4} className="p-4 text-center text-xs">Caricamento utenti...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nessun utente trovato</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {user.full_name?.charAt(0) || user.email.charAt(0)}
                                            </div>
                                            {editingUserId === user.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editNameValue}
                                                        onChange={(e) => setEditNameValue(e.target.value)}
                                                        className="h-7 w-40 text-xs"
                                                        autoFocus
                                                        onBlur={() => saveName(user.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveName(user.id);
                                                            if (e.key === 'Escape') cancelEdit();
                                                        }}
                                                    />
                                                    <Button size="sm" variant="ghost" onClick={() => saveName(user.id)} className="h-6 w-6 p-0 text-green-600">
                                                        <Plus className="h-4 w-4 rotate-45" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span
                                                    className="cursor-pointer hover:underline decoration-dashed underline-offset-4"
                                                    onClick={() => startEditingName(user)}
                                                    title="Click per modificare il nome"
                                                >
                                                    {user.full_name || 'N/D'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="project_manager">Project Manager</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="operator">Operator</option>
                                        </Select>
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800" />

            <PriceListSection />

            <hr className="border-slate-200 dark:border-slate-800" />

            <ImportSection />

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* --- Existing Failure Reasons Section --- */}
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
                    <Button onClick={() => setOpenModal(true)} variant="outline" className="gap-2">
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

            {/* --- Existing Modal --- */}
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
