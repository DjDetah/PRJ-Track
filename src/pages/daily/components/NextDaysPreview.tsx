interface NextDaysPreviewProps {
    data: any[];
}

export function NextDaysPreview({ data }: NextDaysPreviewProps) {
    // Process data to group by date and project count
    const grouped = data.reduce((acc: any, curr: any) => {
        const date = new Date(curr.data_pianificazione).toLocaleDateString();
        const project = curr.work_orders?.progetto || 'Senza Progetto';

        if (!acc[date]) acc[date] = {};
        if (!acc[date][project]) acc[date][project] = 0;
        acc[date][project]++;

        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
        // Simple date parse for sorting (DD/MM/YYYY or similar depending on locale)
        // Better to use timestamp if possible, but let's try to parse
        const [d1, m1, y1] = a.split('/');
        const [d2, m2, y2] = b.split('/');
        return new Date(Number(y1), Number(m1) - 1, Number(d1)).getTime() - new Date(Number(y2), Number(m2) - 1, Number(d2)).getTime();
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-full flex flex-col">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                Prossimi 5 Giorni
            </h3>

            <div className="space-y-4 overflow-auto flex-1 pr-2 custom-scrollbar pl-2">
                {sortedDates.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">Nessuna pianificazione prevista.</p>
                ) : (
                    sortedDates.map(date => (
                        <div key={date} className="relative pl-5 border-l border-slate-200 dark:border-slate-800 ml-1.5">
                            <span className="absolute -left-[4.5px] top-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900"></span>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 leading-none">{date}</h4>
                            <div className="flex flex-col gap-1.5">
                                {Object.entries(grouped[date]).map(([project, count]: any) => (
                                    <div key={project} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={project}>{project}</span>
                                        <span className="bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-[9px]">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
