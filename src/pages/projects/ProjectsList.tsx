
import { useEffect, useState } from 'react';
import { workOrderService } from '../../services/workOrderService';
import { economicsService } from '../../services/economicsService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2, Search, X, TrendingUp, TrendingDown, Wallet, Euro, Building2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/cn';
import ProjectDetailModal from './components/ProjectDetailModal';

interface ProjectStat {
    name: string;
    total: number;
    closed: number;
    open: number;
}

export default function ProjectsList() {
    const [stats, setStats] = useState<ProjectStat[]>([]);
    const [economics, setEconomics] = useState({ budget: 0, actual: 0, cost: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [statsData, ecoData] = await Promise.all([
                workOrderService.getProjectStats(),
                economicsService.getOverallEconomics()
            ]);
            setStats(statsData || []);
            setEconomics(ecoData || { budget: 0, actual: 0, cost: 0 });
        } catch (err) {
            console.error('Failed to load project stats', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = stats.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Progetti</h1>
                <p className="text-sm text-slate-500">Panoramica dello stato avanzamento e contabilità generale.</p>
            </div>

            {/* Economics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Budget vs Actual */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Budget vs Effettivo (Ricavi)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-baseline mb-2">
                            <div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">€ {economics.actual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                                <span className="text-xs text-muted-foreground ml-2">Effettivo</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-slate-500">€ {economics.budget.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                                <span className="text-xs text-muted-foreground ml-2">Budget</span>
                            </div>
                        </div>
                        {/* Progress Bar for Budget vs Actual */}
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div
                                className={cn("h-full transition-all duration-500", delta >= 0 ? "bg-green-500" : "bg-amber-500")}
                                style={{ width: `${Math.min((economics.actual / (economics.budget || 1)) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className={cn("font-medium", delta >= 0 ? "text-green-600" : "text-amber-600")}>
                                {delta >= 0 ? '+' : ''}€ {delta.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ({delta >= 0 ? '+' : ''}{((delta / (economics.budget || 1)) * 100).toFixed(1)}%)
                            </span>
                            <span className="text-muted-foreground">rispetto al preventivato</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Costs */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Costi Fornitori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                            € {economics.cost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Totale costi esterni registrati a sistema.
                        </p>
                    </CardContent>
                </Card>

                {/* Margin */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Margine (GP%)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className={cn("text-2xl font-bold", marginPercent >= 20 ? "text-green-600" : marginPercent > 0 ? "text-amber-600" : "text-red-600")}>
                                {marginPercent.toFixed(1)}%
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                                (€ {margin.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Margine operativo lordo sui ricavi effettivi.
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome Progetto</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Totale Work Orders</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right text-green-600 dark:text-green-500">Completati</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right text-blue-600 dark:text-blue-500">Rimanenti</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Avanzamento</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
                                        const percentage = project.total > 0 ? Math.round((project.closed / project.total) * 100) : 0;
                                        return (
                                            <tr key={project.name} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                                <td
                                                    className="p-4 align-middle font-medium cursor-pointer text-primary hover:underline"
                                                    onClick={() => setSelectedProject(project.name)}
                                                >
                                                    {project.name}
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono">{project.total}</td>
                                                <td className="p-4 align-middle text-right font-mono text-green-600 dark:text-green-500 font-semibold">{project.closed}</td>
                                                <td className="p-4 align-middle text-right font-mono text-blue-600 dark:text-blue-500 font-semibold">{project.open}</td>
                                                <td className="p-4 align-middle text-right">
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
