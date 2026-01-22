import { useEffect, useState } from 'react';
import { type WorkOrder, workOrderService } from '../../../services/workOrderService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Timer, BarChart3, CheckCircle2, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '../../../utils/cn';
import { getWorkingDays } from '../../../utils/dateUtils';
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

    // --- KPIs CALCULATION ---
    const totalWOs = workOrders.length;
    const totalPlannings = workOrders.reduce((acc, wo) => acc + (wo.pianificazioni?.length || 0), 0);

    // 1. Performance SLA
    let completedCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    // 2. Gestione Stats
    const gestioneCounts: Record<string, number> = {};

    // 3. Outcome Stats
    const outcomeCounts: Record<string, number> = {};

    workOrders.forEach(wo => {
        // SLA Calculation
        const s = (wo.stato || '').toLowerCase();
        const isClosed = s.includes('chiuso') || s.includes('eseguito') || s.includes('terminato') || s.includes('close');
        if (isClosed) {
            completedCount++;
            if (wo.chiuso && wo.fine_prevista) {
                const closeDate = new Date(wo.chiuso);
                const dueDate = new Date(wo.fine_prevista);
                if (closeDate <= dueDate) onTimeCount++;
                else lateCount++;
            }
        }

        // Gestione
        const gStatus = wo.gestione || 'Da Assegnare';
        gestioneCounts[gStatus] = (gestioneCounts[gStatus] || 0) + 1;

        // Outcomes
        if (wo.pianificazioni) {
            wo.pianificazioni.forEach(p => {
                if (p.esito) {
                    outcomeCounts[p.esito] = (outcomeCounts[p.esito] || 0) + 1;
                }
            });
        }
    });

    const onTimePercentage = completedCount > 0 ? ((onTimeCount / completedCount) * 100).toFixed(1) : '0';

    // Gestione - Top 3
    const sortedGestione = Object.entries(gestioneCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Outcomes - OK Percentage
    const totalOutcomes = Object.values(outcomeCounts).reduce((a, b) => a + b, 0);
    const okOutcomes = outcomeCounts['OK'] || 0;
    const okPercentage = totalOutcomes > 0 ? ((okOutcomes / totalOutcomes) * 100).toFixed(1) : '0';

    // --- Pacing Custom Logic ---
    // Count as "Complete" for Pacing if:
    // 1. Status is closed (traditional)
    // 2. OR has a positive outcome (Esito = OK) - effectively done but maybe not administratively closed
    let pacingCompletedCount = 0;

    workOrders.forEach(wo => {
        const s = (wo.stato || '').toLowerCase();
        const isClosed = s.includes('chiuso') || s.includes('eseguito') || s.includes('terminato') || s.includes('close');

        const hasOkOutcome = wo.pianificazioni?.some(p => p.esito === 'OK');

        if (isClosed || hasOkOutcome) {
            pacingCompletedCount++;
        }
    });

    // --- Timeline Dates ---
    const startDates = workOrders
        .map(wo => wo.avvio_programmato ? new Date(wo.avvio_programmato).getTime() : null)
        .filter((d): d is number => d !== null);

    const endDates = workOrders
        .map(wo => wo.fine_prevista ? new Date(wo.fine_prevista).getTime() : null)
        .filter((d): d is number => d !== null);

    const earliestStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const latestEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;

    // --- Pacing Metric (Sopra/Sotto Soglia) ---
    // Rule: Target = (Total WOs / Total Working Days) * Elapsed Working Days
    let pacingMetric = {
        target: 0,
        actual: pacingCompletedCount,
        total: workOrders.length,
        status: 'N/A' as 'Sopra Soglia' | 'Sotto Soglia' | 'In Linea' | 'N/A',
        delta: 0,
        percentage: 0,
        targetPercentage: 0
    };

    if (earliestStart && latestEnd && workOrders.length > 0) {
        const totalWorkingDays = getWorkingDays(earliestStart, latestEnd);
        const now = new Date();
        // Cap elapsed days at total days if project is over
        const effectiveEndDate = now > latestEnd ? latestEnd : now;
        const elapsedWorkingDays = getWorkingDays(earliestStart, effectiveEndDate);

        if (totalWorkingDays > 0) {
            const dailyRate = workOrders.length / totalWorkingDays;
            const target = dailyRate * elapsedWorkingDays;

            pacingMetric.target = target;
            pacingMetric.delta = pacingCompletedCount - target;
            pacingMetric.status = pacingMetric.delta >= 0 ? 'Sopra Soglia' : 'Sotto Soglia';
            pacingMetric.percentage = (pacingCompletedCount / workOrders.length) * 100;
            pacingMetric.targetPercentage = (target / workOrders.length) * 100;
        }
    }

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

                        {/* Pacing Metric Card */}
                        {pacingMetric.status !== 'N/A' && (
                            <div className="grid grid-cols-1 gap-4">
                                <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-primary/20 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="pt-6 pb-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                        <Gauge className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg leading-none">Pacing Progetto</h3>
                                                        <p className="text-xs text-muted-foreground mt-1">Avanzamento rispetto alla timeline lavorativa</p>
                                                    </div>
                                                </div>
                                                <div className={cn("flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border",
                                                    pacingMetric.delta >= 0
                                                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                                )}>
                                                    {pacingMetric.delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    <span>{pacingMetric.status}</span>
                                                    <span className="font-mono ml-1">({pacingMetric.delta >= 0 ? '+' : ''}{Math.round(pacingMetric.delta)})</span>
                                                </div>
                                            </div>

                                            <div className="relative pt-6 pb-2 mx-2">
                                                {/* Progress Bar Container */}
                                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                                    {/* Actual Progress */}
                                                    <div
                                                        className={cn("h-full transition-all duration-700 ease-out rounded-full", pacingMetric.delta >= 0 ? "bg-primary" : "bg-amber-500")}
                                                        style={{ width: `${Math.min(100, pacingMetric.percentage)}%` }}
                                                    />
                                                </div>

                                                {/* Target Marker */}
                                                <div
                                                    className="absolute top-0 flex flex-col items-center transition-all duration-500 z-10 group cursor-help"
                                                    style={{ left: `${Math.min(100, pacingMetric.targetPercentage)}%`, transform: 'translateX(-50%)' }}
                                                    title={`Target atteso: ${pacingMetric.target.toFixed(1)}`}
                                                >
                                                    <div className="h-9 w-0.5 bg-slate-800 dark:bg-slate-200 dashed border-l-[1.5px] border-dashed opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="text-[9px] font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">TARGET</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-xs text-muted-foreground font-mono px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase tracking-wider">Completati</span>
                                                    <span className="font-bold text-sm text-foreground">{pacingMetric.actual}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase tracking-wider">Target Ad Oggi</span>
                                                    <span className="font-bold text-sm text-foreground">{pacingMetric.target.toFixed(1)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] uppercase tracking-wider">Totale</span>
                                                    <span className="font-bold text-sm text-foreground">{pacingMetric.total}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Row 1: KPI Cards */}
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
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Contabilità</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Budget</span>
                                            <span className="font-mono font-bold">€ {economics.budget.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Effettivo</span>
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">€ {economics.actual.toFixed(2)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Scostamento</div>
                                                <div className={cn("text-xs font-mono font-bold", (economics.actual - economics.budget) >= 0 ? "text-green-600" : "text-red-600")}>
                                                    {(economics.actual - economics.budget).toFixed(0)}€
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Margine</div>
                                                <div className={cn("text-xs font-mono font-bold",
                                                    economics.actual > 0 && ((economics.actual - economics.cost) / economics.actual) > 0.2 ? "text-green-600" : "text-amber-600"
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
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col justify-center h-full min-h-[140px]">
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full"></div>
                                        <div className="flex flex-col items-start bg-white dark:bg-slate-950 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                    <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">Inizio</span>
                                            </div>
                                            <span className="text-sm font-bold">{formatDate(earliestStart)}</span>
                                        </div>
                                        <div className="flex flex-col items-end bg-white dark:bg-slate-950 pl-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold uppercase text-red-500 dark:text-red-400">Fine</span>
                                                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                                    <CalendarIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold">{formatDate(latestEnd)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Row 2: Analysis Cards (NEW) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* Performance SLA */}
                            <Card className="shadow-sm border-slate-200/50">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Performance SLA</CardTitle>
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold">{onTimePercentage}%</span>
                                        <span className="text-xs text-muted-foreground mb-4">Puntualità interventi</span>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>In Orario</span>
                                                <span className="font-mono font-medium">{onTimeCount}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>In Ritardo</span>
                                                <span className="font-mono font-medium">{lateCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stato Gestione */}
                            <Card className="shadow-sm border-slate-200/50">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Stato Gestione</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mt-1">
                                        {sortedGestione.length > 0 ? (
                                            sortedGestione.map(([status, count]) => (
                                                <div key={status} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium">{status}</span>
                                                        <span className="text-muted-foreground">{count}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full",
                                                                status === 'Completato' ? 'bg-emerald-500' :
                                                                    status === 'In Corso' ? 'bg-violet-500' :
                                                                        status === 'Da Pianificare' ? 'bg-amber-500' :
                                                                            'bg-blue-400'
                                                            )}
                                                            style={{ width: `${(count / totalWOs) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-muted-foreground text-center py-4">Nessun dato disponibile</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Esiti Interventi */}
                            <Card className="shadow-sm border-slate-200/50">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Esiti Interventi</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex items-center justify-center w-16 h-16">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                                                    strokeDasharray={175.92}
                                                    strokeDashoffset={175.92 - (175.92 * Number(okPercentage)) / 100}
                                                    className="text-green-500 transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <span className="absolute text-xs font-bold">{Number(okPercentage).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1">
                                                <span className="text-muted-foreground">Successo (OK)</span>
                                                <span className="font-bold text-green-600">{okOutcomes}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Totale Esiti</span>
                                                <span className="font-bold">{totalOutcomes}</span>
                                            </div>
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
                                                            .map(p => p.data_pianificazione ? new Date(p.data_pianificazione).getTime() : NaN)
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
