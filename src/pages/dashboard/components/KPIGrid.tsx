import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface KPIGridProps {
    total: number;
    statusCounts: { name: string; count: number }[];
    overdue: number;
    onSelect: (category: string | null) => void;
    selected: string | null;
}

export function KPIGrid({ total, statusCounts, overdue, onSelect, selected }: KPIGridProps) {
    const getCardStyle = (category: string) => {
        const isSelected = selected === category;
        const baseStyle = "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm";
        const selectedStyle = "ring-2 ring-primary ring-offset-2 shadow-primary/20";
        return `${baseStyle} ${isSelected ? selectedStyle : ""}`;
    };

    return (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            <Card
                className={getCardStyle('TOTAL')}
                onClick={() => onSelect(selected === 'TOTAL' ? null : 'TOTAL')}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                    <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200">Totale</CardTitle>
                    <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Activity className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{total}</div>
                </CardContent>
            </Card>

            {statusCounts.map((status) => (
                <Card
                    key={status.name}
                    className={getCardStyle(status.name)}
                    onClick={() => onSelect(selected === status.name ? null : status.name)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                        <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={status.name}>
                            {status.name}
                        </CardTitle>
                        <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
                            <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-slate-900 dark:text-white">{status.count}</div>
                    </CardContent>
                </Card>
            ))}

            <Card
                className={`${getCardStyle('OVERDUE')} ${overdue > 0 ? "!bg-red-50/50 !border-red-200 dark:!bg-red-900/10 dark:!border-red-800" : ""}`}
                onClick={() => onSelect(selected === 'OVERDUE' ? null : 'OVERDUE')}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                    <CardTitle className={overdue > 0 ? "text-red-700 dark:text-red-400 font-bold text-xs" : "text-xs font-semibold text-slate-700 dark:text-slate-200"}>
                        Scaduti
                    </CardTitle>
                    <div className={`p-1.5 rounded-full ${overdue > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-orange-50 dark:bg-orange-900/20"}`}>
                        <AlertCircle className={`h-3 w-3 ${overdue > 0 ? "text-red-600 dark:text-red-400" : "text-orange-500"}`} />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className={`text-xl font-bold ${overdue > 0 ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                        {overdue}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
