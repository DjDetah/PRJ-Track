import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

interface ProjectTableProps {
    data: { name: string; count: number; overdue?: number; percentage: number }[];
    onSelect: (project: string | null) => void;
    selected: string | null;
}

export function ProjectTable({ data, onSelect, selected }: ProjectTableProps) {
    // Take top 15 projects
    const displayProjects = data.sort((a, b) => b.count - a.count).slice(0, 15);

    return (
        <Card className="col-span-1 h-full">
            <CardHeader>
                <CardTitle>Work Orders per Progetto</CardTitle>
                <CardDescription>Clicca per filtrare. <span className="text-red-500 font-bold">•</span> Indica scadenze.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayProjects.map((project) => {
                        // Calculate overdue percentage relative to the dashboard total for visualization
                        // 'percentage' is (count / total) * 100.
                        // We want the red bar to be proportional to overdue count on the SAME scale as the blue bar.
                        // Blue Bar Width = (count / total) * 100 = percentage.
                        // Red Bar Width = (overdue / total) * 100.
                        // We can derive total from (count / percentage * 100), or simpler:
                        // RedWidth = (overdue / count) * percentage.

                        const overdueCount = project.overdue || 0;
                        const overduePercentage = project.count > 0
                            ? (overdueCount / project.count) * project.percentage
                            : 0;

                        return (
                            <div
                                key={project.name}
                                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selected === project.name
                                    ? "bg-primary/10 ring-1 ring-primary"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                                onClick={() => onSelect(selected === project.name ? null : project.name)}
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-medium leading-none truncate max-w-[150px]" title={project.name}>
                                            {project.name}
                                        </p>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span className="font-semibold">{project.count}</span>
                                            {overdueCount > 0 && <span className="text-red-500 font-bold">({overdueCount})</span>}
                                        </div>
                                    </div>

                                    <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        {/* Main Bar (Total) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                            style={{ width: `${project.percentage}%` }}
                                        />
                                        {/* Overdue Bar (Red) - Overlaid on top */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-pink-500 z-10 opacity-90 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                            style={{ width: `${overduePercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {data.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center">Nessun progetto trovato.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
