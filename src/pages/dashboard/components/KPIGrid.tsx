import { Activity, CheckCircle, AlertCircle, CheckSquare, Timer, Send, FileText } from 'lucide-react';
import { UnifiedStatCard } from '../../../components/UnifiedStatCard';

interface KPIGridProps {
    total: number;
    statusCounts: { name: string; count: number }[];
    overdue: number;
    onSelect: (category: string | null) => void;
    selected: string | null;
}

export function KPIGrid({ total, statusCounts, overdue, onSelect, selected }: KPIGridProps) {

    const getStatusConfig = (status: string) => {
        const s = status.toLowerCase();

        if (s === 'accettato') return { icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        if (s.includes('chiuso') || s.includes('completato')) return { icon: CheckSquare, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
        if (s === 'in attesa') return { icon: Timer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
        if (s === 'in attesa di invio') return { icon: Send, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' };

        return { icon: FileText, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-2">
            <UnifiedStatCard
                title="Totale"
                value={total}
                icon={Activity}
                color="text-slate-600 dark:text-slate-400"
                bgColor="bg-slate-100 dark:bg-slate-800"
                isActive={selected === 'TOTAL'}
                onClick={() => onSelect(selected === 'TOTAL' ? null : 'TOTAL')}
                className="flex-1 min-w-[150px]"
            />

            {statusCounts.map((status) => {
                const config = getStatusConfig(status.name);
                return (
                    <UnifiedStatCard
                        key={status.name}
                        title={status.name}
                        value={status.count}
                        icon={config.icon}
                        color={config.color}
                        bgColor={config.bg}
                        isActive={selected === status.name}
                        onClick={() => onSelect(selected === status.name ? null : status.name)}
                        className="flex-1 min-w-[150px]"
                    />
                );
            })}

            <UnifiedStatCard
                title="Scaduti"
                value={overdue}
                icon={AlertCircle}
                color={overdue > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}
                bgColor={overdue > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/20"}
                isActive={selected === 'OVERDUE'}
                onClick={() => onSelect(selected === 'OVERDUE' ? null : 'OVERDUE')}
                className="flex-1 min-w-[150px]"
            />
        </div>
    );
}
