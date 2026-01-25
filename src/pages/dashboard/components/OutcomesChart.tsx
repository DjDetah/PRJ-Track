import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { BarChart, Legend } from '@tremor/react';

interface OutcomesChartProps {
    data: { name: string; value: number }[];
}

const valueFormatter = (number: number) => number.toString();

const colorMap: Record<string, string> = {
    'OK': 'emerald',
    'NON OK': 'rose',
    'IN CORSO': 'yellow',
};

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

    // Transform data for Tremor BarChart to have different colors
    // Format: [{ name: 'Esiti', 'OK': 10, 'NON OK': 5, ... }]
    const transformedData = [
        data.reduce((acc, item) => ({ ...acc, [item.name]: item.value }), { name: 'Esiti' })
    ];

    const categories = data.map(d => d.name);
    const colors = data.map(d => colorMap[d.name] || 'gray');

    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Esiti Interventi</CardTitle>
                <CardDescription>
                    Distribuzione degli esiti delle pianificazioni
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center p-2">
                <BarChart
                    className="mt-2 flex-1 w-full"
                    data={transformedData}
                    index="name"
                    categories={categories}
                    colors={colors}
                    valueFormatter={valueFormatter}
                    yAxisWidth={48}
                    showLegend={false}
                />
                <div className="mt-2 w-full flex justify-center scale-75">
                    <Legend
                        categories={categories}
                        colors={colors}
                        className="max-w-full justify-center"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
