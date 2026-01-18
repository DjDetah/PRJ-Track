import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function StatusChart({ data }: StatusChartProps) {
    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Distribuzione Stati</CardTitle>
                <CardDescription>Panoramica dello stato avanzamento lavori</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {data.map((_, index) => (
                                <linearGradient id={`grad-${index}`} key={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                                </linearGradient>
                            ))}
                        </defs>
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
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
