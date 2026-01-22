import { useEffect, useState } from 'react';
import { workOrderService, type WorkOrder } from '../../services/workOrderService';
import { KPIGrid } from './components/KPIGrid';
import { StatusChart } from './components/StatusChart';
import { ProjectTable } from './components/ProjectTable';
import { PerformanceChart } from './components/PerformanceChart';
import { GestioneChart } from './components/GestioneChart'; // NEW
import { OutcomesChart } from './components/OutcomesChart'; // NEW
import { FailureReasonsTable } from './components/FailureReasonsTable';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export default function Dashboard() {
    const [rawData, setRawData] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selection State
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await workOrderService.getAll();
                setRawData(data || []);
            } catch (err: any) {
                console.error(err);
                setError('Impossibile caricare i dati della dashboard.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Filtering Helpers
    const matchesCategory = (wo: WorkOrder, category: string | null) => {
        if (!category || category === 'TOTAL') return true;
        const now = new Date();
        const status = (wo.stato || '').toLowerCase();
        // Handle special 'OVERDUE' category
        if (category === 'OVERDUE') {
            const isClosed = status.includes('chiuso') || status.includes('eseguito') || status.includes('terminato') || status.includes('close');
            const dueDate = wo.fine_prevista ? new Date(wo.fine_prevista) : null;
            return !isClosed && dueDate && now > dueDate;
        }
        // Exact match for dynamic status cards (using the raw string)
        return wo.stato === category;
    };

    const matchesProject = (wo: WorkOrder, project: string | null) => {
        if (!project) return true;
        return wo.progetto === project;
    };

    // 1. Data for KPI Grid & Charts (Filtered by BOTH Project & Category)
    const kpiData = rawData.filter(wo => matchesProject(wo, selectedProject) && matchesCategory(wo, selectedCategory));

    // 2. Data for Project Table (Filtered by Category ONLY, to keep all projects visible but count only relevant items)
    const tableData = rawData.filter(wo => matchesCategory(wo, selectedCategory));

    // Calculate Metrics
    const calculateStats = (data: WorkOrder[], allStatusesReference: string[] = []) => {
        const statusCounts: Record<string, number> = {};
        const projectCounts: Record<string, { count: number; overdue: number }> = {};

        // NEW: Gestione Counts
        const gestioneCounts: Record<string, number> = {};
        // NEW: Outcome Counts
        // NEW: Outcome Counts
        const outcomeCounts: Record<string, number> = {};
        // NEW: Failure Reasons
        const failureReasonCounts: Record<string, number> = {};

        let completedCount = 0;
        let overdueCount = 0;
        let onTimeCount = 0;
        let lateCount = 0;

        const now = new Date();

        // Initialize with 0 for all known statuses
        allStatusesReference.forEach(s => statusCounts[s] = 0);

        data.forEach(wo => {
            const valStatus = wo.stato || 'Unknown';
            const valProject = wo.progetto || 'N/A';
            const valGestione = wo.gestione || 'Da Assegnare';

            // Initialize project stats if new
            if (!projectCounts[valProject]) {
                projectCounts[valProject] = { count: 0, overdue: 0 };
            }

            statusCounts[valStatus] = (statusCounts[valStatus] || 0) + 1;
            projectCounts[valProject].count += 1;

            // Track Gestione
            gestioneCounts[valGestione] = (gestioneCounts[valGestione] || 0) + 1;

            // Track Outcomes (Outcomes are nested in plannings)
            if (wo.pianificazioni) {
                wo.pianificazioni.forEach(p => {
                    if (p.esito) {
                        outcomeCounts[p.esito] = (outcomeCounts[p.esito] || 0) + 1;
                        if (p.esito === 'NON OK' && p.motivazione_fallimento) {
                            failureReasonCounts[p.motivazione_fallimento] = (failureReasonCounts[p.motivazione_fallimento] || 0) + 1;
                        }
                    }
                });
            }

            const s = valStatus.toLowerCase();
            const isClosed = s.includes('chiuso') || s.includes('eseguito') || s.includes('terminato') || s.includes('close');

            let isOverdue = false;
            if (isClosed) {
                completedCount++;
                if (wo.chiuso && wo.fine_prevista) {
                    const closeDate = new Date(wo.chiuso);
                    const dueDate = new Date(wo.fine_prevista);
                    if (closeDate <= dueDate) onTimeCount++;
                    else lateCount++;
                }
            } else {
                if (wo.fine_prevista) {
                    const dueDate = new Date(wo.fine_prevista);
                    if (now > dueDate) {
                        overdueCount++;
                        isOverdue = true;
                    }
                }
            }

            // Track per-project overdue
            if (isOverdue) {
                projectCounts[valProject].overdue += 1;
            }
        });

        return {
            total: data.length,
            completed: completedCount,
            overdue: overdueCount,
            onTime: onTimeCount,
            late: lateCount,
            // Sort by name for confirmed consistent UI position
            statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value, count: value })).sort((a, b) => a.name.localeCompare(b.name)),
            projectBreakdown: Object.entries(projectCounts).map(([name, stats]) => ({
                name,
                count: stats.count,
                overdue: stats.overdue,
                percentage: data.length > 0 ? (stats.count / data.length) * 100 : 0
            })),
            // NEW Returns
            gestioneDistribution: Object.entries(gestioneCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            outcomeDistribution: Object.entries(outcomeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            failureReasonDistribution: Object.entries(failureReasonCounts)
                .map(([reason, count]) => ({
                    reason,
                    count,
                    percentage: outcomeCounts['NON OK'] > 0 ? (count / outcomeCounts['NON OK']) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count),
        };
    };

    // Global Status List (Calculated from raw data to know all possibilities)
    const globalUniqueStatuses = Array.from(new Set(rawData.map(wo => wo.stato || 'Unknown'))).filter(s => s !== 'Unknown');

    // Stats for the Visualization (Charts + KPIs)
    const viewStats = calculateStats(kpiData, globalUniqueStatuses);

    // Stats for the Project Table Structure (Just using the Project breakdown mostly)
    const tableStats = calculateStats(tableData);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Panoramica attività e analisi SLA.
                    </p>
                </div>
                {(selectedProject || selectedCategory) && (
                    <button
                        onClick={() => { setSelectedProject(null); setSelectedCategory(null); }}
                        className="text-sm font-medium text-destructive hover:bg-destructive/10 px-3 py-1 rounded-md transition-colors border border-destructive/20"
                    >
                        Resetta Filtri
                    </button>
                )}
            </div>

            <KPIGrid
                total={viewStats.total}
                statusCounts={viewStats.statusDistribution}
                overdue={viewStats.overdue}
                onSelect={setSelectedCategory}
                selected={selectedCategory}
            />

            {/* Grid Layout 50/50 */}
            <div className="grid gap-4 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 flex-1">

                {/* Left Column (Charts) */}
                <div className="flex flex-col gap-4">

                    {/* Row 1: Status & Performance */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <StatusChart data={
                            selectedCategory && selectedCategory !== 'OVERDUE' && selectedCategory !== 'TOTAL'
                                ? viewStats.statusDistribution.filter(s => s.name === selectedCategory)
                                : viewStats.statusDistribution
                        } />
                        <PerformanceChart onTime={viewStats.onTime} late={viewStats.late} totalClosed={viewStats.completed} />
                    </div>

                    {/* Row 2: Gestione & Outcomes (NEW) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <GestioneChart data={viewStats.gestioneDistribution} />
                        <OutcomesChart data={viewStats.outcomeDistribution} />
                    </div>

                    {/* NEW: Failure Reasons Table */}
                    <div className="grid grid-cols-1 gap-4">
                        <FailureReasonsTable data={viewStats.failureReasonDistribution} />
                    </div>

                </div>

                {/* Right Column (Projects) */}
                <div className="flex flex-col">
                    <ProjectTable
                        data={tableStats.projectBreakdown}
                        onSelect={setSelectedProject}
                        selected={selectedProject}
                    />
                </div>
            </div>
        </div>
    );
}
