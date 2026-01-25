import { CheckCircle2, XCircle, Clock, ClipboardList } from 'lucide-react';
import { UnifiedStatCard } from '../../../components/UnifiedStatCard';

interface DailyStatsProps {
    total: number;
    inProgress: number;
    ok: number;
    nonOk: number;
}

export function DailyStats({ total, inProgress, ok, nonOk }: DailyStatsProps) {
    const stats = [
        {
            label: 'Totale Interventi',
            value: total,
            icon: ClipboardList,
            color: 'text-slate-600 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-800',
        },
        {
            label: 'In Corso',
            value: inProgress,
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
        },
        {
            label: 'Esito OK',
            value: ok,
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            label: 'Esito NON OK',
            value: nonOk,
            icon: XCircle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-100 dark:bg-rose-900/30',
        },
    ];

    return (
        <div className="flex gap-4 h-full">
            {stats.map((stat, i) => (
                <UnifiedStatCard
                    key={i}
                    title={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    bgColor={stat.bg}
                    className="flex-1"
                />
            ))}
        </div>
    );
}
