import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceChartProps {
    onTime: number;
    late: number;
    totalClosed: number;
}

export function PerformanceChart({ onTime, late, totalClosed }: PerformanceChartProps) {
    const data = [
        { name: 'In Orario', value: onTime, color: '#22c55e' }, // Green
        { name: 'In Ritardo', value: late, color: '#ef4444' },  // Red
    ];

    const percentageOnTime = totalClosed > 0 ? ((onTime / totalClosed) * 100).toFixed(1) : 0;

    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Performance SLA</CardTitle>
                <CardDescription>
                    Tasso di puntualità: <span className="font-bold text-primary">{percentageOnTime}%</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} dy={10} />
                        <YAxis tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color === '#22c55e' ? 'url(#grad-green)' : 'url(#grad-red)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
