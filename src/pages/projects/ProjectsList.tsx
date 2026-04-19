
import { useEffect, useState } from 'react';
import { workOrderService } from '../../services/workOrderService';
import { economicsService } from '../../services/economicsService';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Card as TremorCard, Text, Flex, ProgressBar, Badge, Icon, Title, Grid } from '@tremor/react';
import { Loader2, Search, X, TrendingUp, TrendingDown, Wallet, Building2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/cn';
import ProjectDetailModal from './components/ProjectDetailModal';
import { useClient } from '../../contexts/ClientContext';

interface ProjectStat {
    name: string;
    total: number;
    closed: number;
    open: number;
    budget?: number;
    actual?: number;
    cost?: number;
    pacingStatus?: 'Sopra Soglia' | 'Sotto Soglia' | 'In Linea' | 'N/A';
    marginPercent?: number; // Added for sorting
    percentage?: number; // Added for sorting
}

export default function ProjectsList() {
    const { activeCliente } = useClient();
    const [stats, setStats] = useState<ProjectStat[]>([]);
    const [economics, setEconomics] = useState({ budget: 0, actual: 0, cost: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ProjectStat; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        if (activeCliente) {
            loadStats();
        } else {
            setStats([]);
            setEconomics({ budget: 0, actual: 0, cost: 0 });
            setLoading(false);
        }
    }, [activeCliente?.id]);

    const loadStats = async () => {
        try {
            const [statsData, ecoData, projectEco] = await Promise.all([
                workOrderService.getProjectStats(activeCliente?.id),
                economicsService.getOverallEconomics(activeCliente?.id),
                economicsService.getAllProjectEconomics(activeCliente?.id)
            ]);

            const mergedStats = statsData?.map(stat => {
                const total = stat.total || 0;
                const closed = stat.closed || 0;
                const actual = projectEco[stat.name]?.actual || 0;
                const cost = projectEco[stat.name]?.cost || 0;
                const margin = actual - cost;
                
                return {
                    ...stat,
                    budget: projectEco[stat.name]?.budget || 0,
                    actual,
                    cost,
                    marginPercent: actual > 0 ? (margin / actual) * 100 : 0,
                    percentage: total > 0 ? Math.round((closed / total) * 100) : 0
                };
            }) || [];

            setStats(mergedStats);
            setEconomics(ecoData || { budget: 0, actual: 0, cost: 0 });
        } catch (err) {
            console.error('Failed to load project stats', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = stats
        .filter(project => project.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const aVal = a[sortConfig.key] ?? 0;
            const bVal = b[sortConfig.key] ?? 0;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSort = (key: keyof ProjectStat) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/30 inline-block" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-3 w-3 text-primary inline-block" />
            : <ArrowDown className="ml-1 h-3 w-3 text-primary inline-block" />;
    };

    // Calculated Metrics
    const delta = economics.actual - economics.budget;
    const margin = economics.actual > 0 ? (economics.actual - economics.cost) : 0;
    const marginPercent = economics.actual > 0 ? (margin / economics.actual) * 100 : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {/* Economics Overview Cards (Tremor Style) */}
            <Grid numItemsMd={4} className="gap-4">
                {/* Budget vs Actual */}
                <TremorCard className="md:col-span-2 ring-0 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/60 p-4">
                    <Flex justifyContent="start" className="space-x-2">
                        <Icon icon={Wallet} color="blue" variant="light" size="xs" />
                        <Title className="text-sm">Budget vs Ricavi</Title>
                    </Flex>
                    <Flex className="mt-2" alignItems="baseline">
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">€ {economics.actual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</Text>
                        <Text className="ml-2 text-xs">/ € {economics.budget.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</Text>
                    </Flex>
                    <ProgressBar
                        value={(economics.budget > 0 ? (economics.actual / economics.budget) * 100 : 0)}
                        color={delta >= 0 ? 'emerald' : 'amber'}
                        className="mt-2 h-2"
                    />
                    <Flex className="mt-2">
                        <Text className="text-xs">
                            {(economics.budget > 0 ? (economics.actual / economics.budget) * 100 : 0).toFixed(1)}% del budget
                        </Text>
                        <Text className={cn("font-bold font-mono text-xs", delta >= 0 ? "text-emerald-600" : "text-amber-600")}>
                            {delta >= 0 ? '+' : ''}€ {delta.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </Text>
                    </Flex>
                </TremorCard>

                {/* Costs */}
                <TremorCard className="ring-0 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/60 p-4">
                    <Flex justifyContent="start" className="space-x-2">
                        <Icon icon={Building2} color="rose" variant="light" size="xs" />
                        <Title className="text-sm">Costi Fornitori</Title>
                    </Flex>
                    <Text className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                        € {economics.cost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text className="mt-1 text-[10px] text-muted-foreground">
                        Costi esterni registrati
                    </Text>
                </TremorCard>

                {/* Margin */}
                <TremorCard className="ring-0 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/60 p-4">
                    <Flex justifyContent="start" className="space-x-2">
                        <Icon icon={TrendingUp} color="emerald" variant="light" size="xs" />
                        <Title className="text-sm">Margine (GP%)</Title>
                    </Flex>
                    <Flex className="mt-2" alignItems="baseline">
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{marginPercent.toFixed(1)}%</Text>
                    </Flex>
                    <Flex className="mt-2">
                        <Badge size="xs" color={marginPercent >= 20 ? 'emerald' : marginPercent > 0 ? 'amber' : 'rose'}>
                            {marginPercent >= 20 ? 'Ottimo' : marginPercent > 0 ? 'Buono' : 'Attenzione'}
                        </Badge>
                        <Text className="font-mono text-[10px] ml-auto">
                            (€ {margin.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                        </Text>
                    </Flex>
                </TremorCard>
            </Grid>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 w-full max-w-sm">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca progetto..."
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
                            Mostrando {filteredStats.length} di {stats.length} progetti
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t bg-white dark:bg-slate-950">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                                        Nome Progetto <SortIcon columnKey="name" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('total')}>
                                        Totale Work Orders <SortIcon columnKey="total" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right text-green-600 dark:text-green-500 cursor-pointer hover:text-foreground hover:text-green-700" onClick={() => handleSort('closed')}>
                                        Completati <SortIcon columnKey="closed" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right text-blue-600 dark:text-blue-500 cursor-pointer hover:text-foreground hover:text-blue-700" onClick={() => handleSort('open')}>
                                        Rimanenti <SortIcon columnKey="open" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('percentage')}>
                                        Avanzamento <SortIcon columnKey="percentage" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleSort('pacingStatus')}>
                                        Soglia <SortIcon columnKey="pacingStatus" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('budget')}>
                                        Budget <SortIcon columnKey="budget" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('actual')}>
                                        Ricavi <SortIcon columnKey="actual" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('cost')}>
                                        Costi <SortIcon columnKey="cost" />
                                    </th>
                                    <th className="h-10 px-2 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('marginPercent')}>
                                        Margine (GP%) <SortIcon columnKey="marginPercent" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Search className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p>Nessun progetto trovato.</p>
                                                {searchTerm && (
                                                    <Button variant="link" onClick={() => setSearchTerm('')}>
                                                        Resetta ricerca
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStats.map((project) => {
                                        const percentage = project.percentage || 0;
                                        const actual = project.actual || 0;
                                        const cost = project.cost || 0;
                                        const marginPercent = project.marginPercent || 0;

                                        return (
                                            <tr key={project.name} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                                <td
                                                    className="p-2 align-middle font-medium cursor-pointer text-xs"
                                                    onClick={() => setSelectedProject(project.name)}
                                                >
                                                    {project.name}
                                                </td>
                                                <td className="p-2 align-middle text-right font-mono text-xs">{project.total}</td>
                                                <td className="p-2 align-middle text-right font-mono text-green-600 dark:text-green-500 font-semibold text-xs">{project.closed}</td>
                                                <td className="p-2 align-middle text-right font-mono text-blue-600 dark:text-blue-500 font-semibold text-xs">{project.open}</td>
                                                <td className="p-2 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                                                        <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 align-middle text-center">
                                                    {project.pacingStatus === 'Sopra Soglia' ? (
                                                        <div className="inline-flex p-1 bg-green-100 dark:bg-green-900/30 rounded-full" title="Sopra Soglia">
                                                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        </div>
                                                    ) : project.pacingStatus === 'Sotto Soglia' ? (
                                                        <div className="inline-flex p-1 bg-red-100 dark:bg-red-900/30 rounded-full" title="Sotto Soglia">
                                                            <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground font-mono text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2 align-middle text-right font-mono text-xs">€ {(project.budget || 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                <td className="p-2 align-middle text-right font-mono text-xs">€ {actual.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                <td className="p-2 align-middle text-right font-mono text-xs">€ {cost.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                <td className="p-2 align-middle text-right font-mono text-xs">
                                                    <span className={cn(
                                                        "font-bold",
                                                        marginPercent >= 20 ? "text-green-600" : marginPercent > 0 ? "text-amber-600" : "text-red-600"
                                                    )}>
                                                        {marginPercent.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ProjectDetailModal
                projectName={selectedProject}
                open={!!selectedProject}
                onOpenChange={(open) => !open && setSelectedProject(null)}
            />
        </div>
    );
}
