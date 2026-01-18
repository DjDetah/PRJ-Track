import { useEffect, useState } from 'react';
import { type WorkOrder, workOrderService } from '../../../services/workOrderService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/ui/button';

import { economicsService } from '../../../services/economicsService';

interface ProjectDetailModalProps {
    projectName: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailModal({ projectName, open, onOpenChange }: ProjectDetailModalProps) {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [economics, setEconomics] = useState({ budget: 0, actual: 0, cost: 0 });
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(50);
    const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        if (projectName && open) {
            loadProjectDetails();
        } else {
            setWorkOrders([]);
            setEconomics({ budget: 0, actual: 0, cost: 0 });
            setVisibleCount(50);
        }
    }, [projectName, open]);

    const loadProjectDetails = async () => {
        if (!projectName) return;
        setLoading(true);
        try {
            const [woData, ecoData] = await Promise.all([
                workOrderService.getByProject(projectName),
                economicsService.getProjectEconomics(projectName)
            ]);
            setWorkOrders(woData || []);
            setEconomics(ecoData || { budget: 0, actual: 0, cost: 0 });
        } catch (err) {
            console.error('Failed to load project details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof WorkOrder) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedWorkOrders = [...workOrders].sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const visibleWorkOrders = sortedWorkOrders.slice(0, visibleCount);

    const SortIcon = ({ columnKey }: { columnKey: keyof WorkOrder }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    if (!open) return null;

    // --- KPIs ---
    const totalWOs = workOrders.length;
    const totalPlannings = workOrders.reduce((acc, wo) => acc + (wo.pianificazioni?.length || 0), 0);

    // --- Timeline Dates ---
    const startDates = workOrders
        .map(wo => wo.avvio_programmato ? new Date(wo.avvio_programmato).getTime() : null)
        .filter((d): d is number => d !== null);

    const endDates = workOrders
        .map(wo => wo.fine_prevista ? new Date(wo.fine_prevista).getTime() : null)
        .filter((d): d is number => d !== null);

    const earliestStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const latestEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/D';
        return format(date, 'd MMMM yyyy', { locale: it });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-6">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {projectName}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                Dettaglio Progetto
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-4">
                        {/* Top Cards Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* KPI Card: Efficiency */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Efficienza Pianificazione</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-bold">{totalPlannings}</span>
                                            <span className="text-xs text-muted-foreground">Pianificazioni Totali</span>
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-4"></div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-3xl font-bold">{totalWOs}</span>
                                            <span className="text-xs text-muted-foreground">Work Orders</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        Rapporto medio: {(totalWOs > 0 ? (totalPlannings / totalWOs) : 0).toFixed(2)} pianificazioni per WO
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KPI Card: Economics */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Contabilità di Progetto</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Budget (Prev.)</span>
                                            <span className="font-mono font-bold">€ {economics.budget.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Effettivo (Ricavi)</span>
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">€ {economics.actual.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                                            <span className="text-muted-foreground">Costi (Fornitori)</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">€ {economics.cost.toFixed(2)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Scostamento</div>
                                                <div className={cn("text-xs font-mono font-bold", (economics.actual - economics.budget) >= 0 ? "text-green-600" : "text-red-600")}>
                                                    {economics.actual - economics.budget >= 0 ? '+' : ''}€ {(economics.actual - economics.budget).toFixed(2)}
                                                    <span className="ml-1 opacity-80">
                                                        ({economics.actual - economics.budget >= 0 ? '+' : ''}{((economics.actual - economics.budget) / (economics.budget || 1) * 100).toFixed(1)}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Margine (GP%)</div>
                                                <div className={cn("text-xs font-mono font-bold",
                                                    economics.actual > 0 && ((economics.actual - economics.cost) / economics.actual) > 0.2 ? "text-green-600" :
                                                        economics.actual > 0 && ((economics.actual - economics.cost) / economics.actual) > 0 ? "text-amber-600" : "text-red-600"
                                                )}>
                                                    {economics.actual > 0 ? ((economics.actual - economics.cost) / economics.actual * 100).toFixed(1) : 0}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline Card */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Timeline di Progetto</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col justify-center h-full min-h-[140px]">
                                    <div className="flex items-center justify-between relative">
                                        {/* Connecting Line */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full"></div>

                                        {/* Start Point */}
                                        <div className="flex flex-col items-start bg-white dark:bg-slate-950 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                    <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">Inizio</span>
                                            </div>
                                            <span className="text-lg font-bold">
                                                {formatDate(earliestStart)}
                                            </span>
                                        </div>

                                        {/* End Point */}
                                        <div className="flex flex-col items-end bg-white dark:bg-slate-950 pl-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold uppercase text-red-500 dark:text-red-400">Fine</span>
                                                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                                    <CalendarIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold">
                                                {formatDate(latestEnd)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Work Orders Table */}
                        <div className="border rounded-md">
                            <table className="w-full caption-bottom text-xs text-left">
                                <thead className="[&_tr]:border-b bg-slate-50/50 dark:bg-slate-900/50">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('work_order')}>
                                            <div className="flex items-center">
                                                WO ID <SortIcon columnKey="work_order" />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('stato')}>
                                            <div className="flex items-center">
                                                Stato <SortIcon columnKey="stato" />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground">Pianificato</th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('citta')}>
                                            <div className="flex items-center">
                                                Città <SortIcon columnKey="citta" />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('avvio_programmato')}>
                                            <div className="flex items-center">
                                                Avvio Prog. <SortIcon columnKey="avvio_programmato" />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('fine_prevista')}>
                                            <div className="flex items-center">
                                                Fine Prev. <SortIcon columnKey="fine_prevista" />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 align-middle font-medium text-muted-foreground">Descrizione</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0 bg-white dark:bg-slate-950">
                                    {visibleWorkOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">Nessun work order trovato.</td>
                                        </tr>
                                    ) : (
                                        visibleWorkOrders.map((wo) => (
                                            <tr key={wo.work_order} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-2 align-middle font-medium">{wo.work_order}</td>
                                                <td className="p-2 align-middle">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                        wo.stato === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                            wo.stato === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    )}>
                                                        {wo.stato}
                                                    </span>
                                                </td>
                                                <td className="p-2 align-middle font-mono text-[10px]">
                                                    {(() => {
                                                        if (!wo.pianificazioni?.length) return '-';
                                                        const dates = wo.pianificazioni
                                                            .map(p => new Date(p.data_pianificazione).getTime())
                                                            .filter(t => !isNaN(t));
                                                        if (dates.length === 0) return '-';
                                                        const minDate = new Date(Math.min(...dates));
                                                        return format(minDate, 'dd/MM/yyyy HH:mm');
                                                    })()}
                                                </td>
                                                <td className="p-2 align-middle">{wo.citta}</td>
                                                <td className="p-2 align-middle">
                                                    {wo.avvio_programmato ? format(new Date(wo.avvio_programmato), 'dd/MM/yyyy') : '-'}
                                                </td>
                                                <td className="p-2 align-middle">
                                                    {wo.fine_prevista ? format(new Date(wo.fine_prevista), 'dd/MM/yyyy') : '-'}
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
                        {visibleCount < sortedWorkOrders.length && (
                            <div className="flex justify-center pt-2">
                                <Button variant="outline" size="sm" onClick={() => setVisibleCount(c => c + 50)}>
                                    Carica altri...
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
