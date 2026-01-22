import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OutcomesChartProps {
    data: { name: string; value: number }[];
}

const COLORS: Record<string, string> = {
    'OK': '#22c55e', // Green-500
    'NON OK': '#ef4444', // Red-500
    'IN CORSO': '#eab308', // Yellow-500
};

const DEFAULT_COLOR = '#94a3b8';

export function OutcomesChart({ data }: OutcomesChartProps) {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
                <CardHeader>
                    <CardTitle>Esiti Interventi</CardTitle>
                    <CardDescription>
                        Distribuzione degli esiti delle pianificazioni
                    </CardDescription>
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
                <CardTitle>Esiti Interventi</CardTitle>
                <CardDescription>
                    Distribuzione degli esiti delle pianificazioni
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0 pb-4">
                <div style={{ width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} dx={-10} allowDecimals={false} fontSize={12} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[entry.name] || DEFAULT_COLOR}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
