import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { BarChart, Legend } from '@tremor/react';

interface PerformanceChartProps {
    onTime: number;
    late: number;
    totalClosed: number;
}

const valueFormatter = (number: number) => number.toString();

export function PerformanceChart({ onTime, late, totalClosed }: PerformanceChartProps) {
    // Restructure for multi-color series
    const data = [
        {
            name: 'Stato',
            'In Orario': onTime,
            'In Ritardo': late,
        },
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
            <CardContent className="h-[300px] flex flex-col items-center justify-center p-2">
                <BarChart
                    className="mt-2 flex-1 w-full"
                    data={data}
                    index="name"
                    categories={['In Orario', 'In Ritardo']}
                    colors={['emerald', 'rose']}
                    valueFormatter={valueFormatter}
                    yAxisWidth={48}
                    showLegend={false}
                />
                <div className="mt-2 w-full flex justify-center scale-75">
                    <Legend
                        categories={['In Orario', 'In Ritardo']}
                        colors={['emerald', 'rose']}
                        className="max-w-full justify-center"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
