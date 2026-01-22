import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GestioneChartProps {
    data: { name: string; value: number }[];
}

const COLORS: Record<string, string> = {
    'Completato': '#10b981', // Emerald-500
    'In Corso': '#8b5cf6',   // Violet-500
    'Pianificato': '#0ea5e9', // Sky-500
    'Da Pianificare': '#f59e0b', // Amber-500
    'Da Ripianificare': '#ef4444', // Red-500
    'Da Assegnare': '#64748b', // Slate-500
};

const DEFAULT_COLOR = '#94a3b8'; // Slate-400

export function GestioneChart({ data }: GestioneChartProps) {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
                <CardHeader>
                    <CardTitle>Stato Gestione</CardTitle>
                    <CardDescription>Avanzamento operativo dei lavori</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Nessun dato disponibile
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Stato Gestione</CardTitle>
                <CardDescription>Avanzamento operativo dei lavori</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0 pb-4">
                <div style={{ width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[entry.name] || DEFAULT_COLOR}
                                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
