import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { DonutChart, Legend } from '@tremor/react';

interface StatusChartProps {
    data: { name: string; value: number }[];
}

const valueFormatter = (number: number) => number.toString();

const colorPalette = ["blue", "cyan", "indigo", "violet", "fuchsia", "pink", "rose", "orange"];

export function StatusChart({ data }: StatusChartProps) {
    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Distribuzione Stati</CardTitle>
                <CardDescription>Panoramica dello stato avanzamento lavori</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center p-2">
                <DonutChart
                    className="mt-2"
                    data={data}
                    category="value"
                    index="name"
                    valueFormatter={valueFormatter}
                    colors={colorPalette}
                    variant="pie"
                />
                <div className="mt-2 w-full flex justify-center scale-75">
                    <Legend
                        categories={data.map((item) => item.name)}
                        colors={colorPalette}
                        className="max-w-full justify-center"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
