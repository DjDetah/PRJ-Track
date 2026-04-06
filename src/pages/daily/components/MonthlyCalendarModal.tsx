import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { pianificazioneService } from '../../../services/pianificazioneService';
import { DayDetailsModal } from './DayDetailsModal';

interface MonthlyCalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MonthlyCalendarModal({ open, onOpenChange }: MonthlyCalendarModalProps) {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [monthData, setMonthData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
    const [selectedDayItems, setSelectedDayItems] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadMonthData(currentDate.getFullYear(), currentDate.getMonth());
        }
    }, [open, currentDate]);

    const loadMonthData = async (year: number, month: number) => {
        setLoading(true);
        try {
            const data = await pianificazioneService.getMonthPlan(year, month);
            setMonthData(data || []);
        } catch (error) {
            console.error('Error fetching month data', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Calendar generation logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 is Sunday, make Monday = 0
    };

    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const today = new Date();

    const renderCell = (day: number) => {
        const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

        // Find plannings for this day
        const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = monthData.filter(d => d.data_pianificazione?.startsWith(dayStr));

        const count = dayData.length;

        // Group by project
        const projectCounts = dayData.reduce((acc, curr) => {
            const proj = curr.work_orders?.progetto || 'Senza Progetto';
            acc[proj] = (acc[proj] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return (
            <div 
                key={day} 
                className={`min-h-[100px] p-1.5 border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer transition-colors hover:border-indigo-300 dark:hover:border-indigo-700 ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'bg-white dark:bg-slate-950'}`}
                onClick={() => {
                    // Format to DD/MM/YYYY
                    const dString = `${String(day).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
                    setSelectedDateStr(dString);
                    // dayData contains the data for this specific day
                    setSelectedDayItems(dayData);
                }}
            >
                <span className={`text-xs font-semibold self-start mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                    {day}
                </span>

                {count > 0 && (
                    <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 flex-1">
                        {Object.entries(projectCounts).map(([proj, pCount]) => (
                            <div key={proj} className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded group">
                                <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]" title={proj}>{proj}</span>
                                <span className="text-[9px] font-bold text-slate-900 dark:text-white whitespace-nowrap ml-1">{pCount as number} WO</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[85vw] w-[85vw] max-h-[90vh] flex flex-col p-0 overflow-hidden outline-none">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 m-0 h-full">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Pianificazioni Mensili
                    </DialogTitle>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 max-h-12 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold w-32 text-center uppercase tracking-wider">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center backdrop-blur-sm z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                                <div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[100px] p-2 border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30"></div>
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => renderCell(i + 1))}
                            {/* Fill remaining cells */}
                            {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
                                <div key={`empty-end-${i}`} className="min-h-[100px] p-2 border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <DayDetailsModal
            open={!!selectedDateStr}
            onOpenChange={(o) => (!o && setSelectedDateStr(null))}
            date={selectedDateStr}
            items={selectedDayItems}
        />
        </>
    );
}
