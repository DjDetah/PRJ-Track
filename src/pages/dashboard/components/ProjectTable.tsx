import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';


interface ProjectTableProps {
    data: { name: string; count: number; overdue?: number; percentage: number; completionPercentage?: number }[];
    onSelect: (project: string | null) => void;
    selected: string | null;
}

export function ProjectTable({ data, onSelect, selected }: ProjectTableProps) {
    // Take top 15 projects by VOLUME (count), but display COMPLETION (%) in the bar
    const displayProjects = data.sort((a, b) => b.count - a.count).slice(0, 15);

    return (
        <Card className="col-span-1 h-full shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60">
            <CardHeader>
                <CardTitle>Top Progetti</CardTitle>
                <CardDescription>Avanzamento (Chiusi / Totale)</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex flex-col space-y-1.5 mt-2">
                    {displayProjects.map((item) => {
                        const completion = item.completionPercentage || 0;
                        const isSelected = selected === item.name;

                        return (
                            <div
                                key={item.name}
                                onClick={() => onSelect(isSelected ? null : item.name)}
                                className={`
                                    group relative w-full flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all
                                    ${isSelected ? 'bg-slate-50 dark:bg-slate-800 ring-1 ring-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                `}
                            >
                                {/* Background Bar (Progress Bar) */}
                                <div
                                    className={`absolute inset-y-0 left-0 rounded-md transition-all duration-500 ease-out
                                        ${isSelected ? 'bg-blue-200/50 dark:bg-blue-800/30' : 'bg-blue-100/50 dark:bg-blue-900/20 group-hover:bg-blue-100/80'}
                                    `}
                                    style={{ width: `${completion}%` }}
                                />

                                {/* Content - Relative to sit on top */}
                                <span className="relative z-10 text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={item.name}>
                                    {item.name}
                                </span>
                                <div className="relative z-10 flex gap-2 items-center">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                        {item.count} WO
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[32px] text-right">
                                        {Math.round(completion)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {displayProjects.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nessun progetto disponibile</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
