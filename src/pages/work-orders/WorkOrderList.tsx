import { useEffect, useState } from 'react';
import { workOrderService, type WorkOrder } from '../../services/workOrderService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Search, Loader2, ArrowUpDown, ArrowUp, ArrowDown, X, Filter, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { WorkOrderDetailModal } from './components/WorkOrderDetailModal';
import { cn } from '../../utils/cn';

export default function WorkOrderList() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [visibleCount, setVisibleCount] = useState(50);

    // sorting & filtering
    const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder; direction: 'asc' | 'desc' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await workOrderService.getAll();
            setWorkOrders(data);

            // If a work order is selected, update it with fresh data
            if (selectedWorkOrder) {
                const updatedSelected = data.find(wo => wo.work_order === selectedWorkOrder.work_order);
                if (updatedSelected) {
                    setSelectedWorkOrder(updatedSelected);
                }
            }

            setError(null);
        } catch (err: any) {
            console.error('Error fetching work orders:', err);
            setError('Impossibile caricare i work orders.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleWorkOrderUpdate = () => {
        fetchWorkOrders(true);
    };

    // Calculate status counts
    const statusCounts = workOrders.reduce((acc, wo) => {
        acc[wo.stato] = (acc[wo.stato] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleSort = (key: keyof WorkOrder) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredWorkOrders = workOrders
        .filter(wo => {
            const matchesSearch = wo.work_order.toLowerCase().includes(searchTerm.toLowerCase()) ||
                wo.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                wo.stato.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter ? wo.stato === statusFilter : true;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;

            // Handle potentially null/undefined values safely
            const aValue = a[sortConfig.key] ?? '';
            const bValue = b[sortConfig.key] ?? '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const visibleWorkOrders = sortedAndFilteredWorkOrders.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 50);
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof WorkOrder }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
                    <p className="text-muted-foreground">Gestisci le attività operative</p>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Errore</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Status Filter Cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
                <Card
                    onClick={() => setStatusFilter(null)}
                    className={cn(
                        "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm min-w-[140px]",
                        statusFilter === null ? "ring-2 ring-primary ring-offset-2 shadow-primary/20" : ""
                    )}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Totale</div>
                        <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                            <Filter className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{workOrders.length}</div>
                    </CardContent>
                </Card>

                {Object.entries(statusCounts).map(([status, count]) => (
                    <Card
                        key={status}
                        onClick={() => setStatusFilter(status === statusFilter ? null : status)}
                        className={cn(
                            "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm min-w-[140px]",
                            statusFilter === status ? "ring-2 ring-primary ring-offset-2 shadow-primary/20" : ""
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase truncate" title={status}>{status}</div>
                            <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{count}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 w-full max-w-sm">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca per ID, Città o Stato..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                            {searchTerm && (
                                <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Mostrando {Math.min(visibleCount, sortedAndFilteredWorkOrders.length)} di {sortedAndFilteredWorkOrders.length} risultati
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <table className="w-full caption-bottom text-xs text-left">
                            <thead className="[&_tr]:border-b bg-slate-50/50 dark:bg-slate-900/50">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th
                                        className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleSort('work_order')}
                                    >
                                        <div className="flex items-center">
                                            Work Order
                                            <SortIcon columnKey="work_order" />
                                        </div>
                                    </th>
                                    <th
                                        className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleSort('progetto')}
                                    >
                                        <div className="flex items-center">
                                            Progetto
                                            <SortIcon columnKey="progetto" />
                                        </div>
                                    </th>
                                    <th
                                        className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleSort('stato')}
                                    >
                                        <div className="flex items-center">
                                            Stato
                                            <SortIcon columnKey="stato" />
                                        </div>
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground">
                                        Gestione
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground">
                                        Pianificazione
                                    </th>
                                    <th
                                        className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleSort('citta')}
                                    >
                                        <div className="flex items-center">
                                            Città
                                            <SortIcon columnKey="citta" />
                                        </div>
                                    </th>
                                    <th
                                        className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleSort('avvio_programmato')}
                                    >
                                        <div className="flex items-center">
                                            Programmato
                                            <SortIcon columnKey="avvio_programmato" />
                                        </div>
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground">Descrizione</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {visibleWorkOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Search className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p>Nessun Work Order trovato con i filtri correnti.</p>
                                                {(searchTerm || statusFilter) && (
                                                    <Button
                                                        variant="link"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setStatusFilter(null);
                                                        }}
                                                    >
                                                        Resetta filtri
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    visibleWorkOrders.map((wo) => (
                                        <tr
                                            key={wo.work_order}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                                            onClick={() => setSelectedWorkOrder(wo)}
                                        >
                                            <td className="p-2 align-middle font-medium">{wo.work_order}</td>
                                            <td className="p-2 align-middle text-muted-foreground">{wo.progetto || '-'}</td>
                                            <td className="p-2 align-middle">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                                                    wo.stato === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                        wo.stato === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                )}>
                                                    {wo.stato}
                                                </span>
                                            </td>
                                            <td className="p-2 align-middle">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors border",
                                                    !wo.gestione || wo.gestione === 'Da Assegnare' ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                                                        wo.gestione === 'Da Pianificare' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" :
                                                            wo.gestione === 'Pianificato' ? "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800" :
                                                                wo.gestione === 'In Corso' ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" :
                                                                    wo.gestione === 'Completato' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                                                        wo.gestione === 'Da Ripianificare' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" :
                                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                )}>
                                                    {wo.gestione || 'Da Assegnare'}
                                                </span>
                                            </td>
                                            <td className="p-2 align-middle font-mono text-[10px]">
                                                {(() => {
                                                    if (!wo.pianificazioni?.length) return '-';
                                                    // Find earliest date
                                                    const dates = wo.pianificazioni
                                                        .filter(p => p.data_pianificazione)
                                                        .map(p => new Date(p.data_pianificazione!).getTime())
                                                        .filter(t => !isNaN(t));
                                                    if (dates.length === 0) return '-';
                                                    const minDate = new Date(Math.min(...dates));
                                                    return minDate.toLocaleString('it-IT', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    });
                                                })()}
                                            </td>
                                            <td className="p-2 align-middle">{wo.citta}</td>
                                            <td className="p-2 align-middle">
                                                {wo.avvio_programmato ? new Date(wo.avvio_programmato).toLocaleDateString('it-IT') : '-'}
                                            </td>
                                            <td className="p-2 align-middle max-w-xs truncate" title={wo.descrizione || ''}>
                                                {wo.descrizione}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Load More Button */}
                    {visibleCount < sortedAndFilteredWorkOrders.length && (
                        <div className="p-4 border-t flex justify-center bg-slate-50/30 dark:bg-slate-900/30">
                            <Button variant="outline" size="sm" onClick={handleLoadMore}>
                                Carica altri... ({sortedAndFilteredWorkOrders.length - visibleWorkOrders.length} rimanenti)
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <WorkOrderDetailModal
                workOrder={selectedWorkOrder}
                open={!!selectedWorkOrder}
                onOpenChange={(open) => !open && setSelectedWorkOrder(null)}
                onUpdate={handleWorkOrderUpdate}
            />
        </div>
    );
}
