import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Calendar } from 'lucide-react';
import { MonthlyCalendarModal } from './MonthlyCalendarModal';
import { DayDetailsModal } from './DayDetailsModal';

interface NextDaysPreviewProps {
    data: any[];
}

export function NextDaysPreview({ data }: NextDaysPreviewProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Process data to group by date and project count
    const grouped = data.reduce((acc: any, curr: any) => {
        const date = new Date(curr.data_pianificazione).toLocaleDateString();
        const project = curr.work_orders?.progetto || 'Senza Progetto';

        if (!acc[date]) acc[date] = {};
        if (!acc[date][project]) acc[date][project] = 0;
        acc[date][project]++;

        return acc;
    }, {});

    // Group raw items by date for the DayDetailsModal
    const itemsByDate = data.reduce((acc: any, curr: any) => {
        const date = new Date(curr.data_pianificazione).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(curr);
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
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    Prossimi 5 Giorni
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                    onClick={() => setIsCalendarOpen(true)}
                >
                    <Calendar className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4 overflow-auto flex-1 pr-2 custom-scrollbar pl-2">
                {sortedDates.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">Nessuna pianificazione prevista.</p>
                ) : (
                    sortedDates.map(date => (
                        <div
                            key={date}
                            className="relative pl-5 border-l border-slate-200 dark:border-slate-800 ml-1.5 cursor-pointer group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className="absolute -left-[4.5px] top-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900 group-hover:scale-125 transition-transform"></span>
                            <div className="p-1 -ml-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <h4 className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 uppercase tracking-wider mb-1 leading-none">{date}</h4>
                                <div className="flex flex-col gap-1.5">
                                    {Object.entries(grouped[date]).map(([project, count]: any) => (
                                        <div key={project} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 transition-colors">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={project}>{project}</span>
                                            <span className="bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-[9px]">
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <MonthlyCalendarModal
                open={isCalendarOpen}
                onOpenChange={setIsCalendarOpen}
            />

            <DayDetailsModal
                open={!!selectedDate}
                onOpenChange={(open) => !open && setSelectedDate(null)}
                date={selectedDate}
                items={selectedDate ? itemsByDate[selectedDate] || [] : []}
            />
        </div>
    );
}
