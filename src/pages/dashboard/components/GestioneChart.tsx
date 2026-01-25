import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { DonutChart, Legend } from '@tremor/react';

interface GestioneChartProps {
    data: { name: string; value: number }[];
}

const valueFormatter = (number: number) => number.toString();

const colorMap: Record<string, string> = {
    'Completato': 'emerald',
    'In Corso': 'violet',
    'Pianificato': 'sky',
    'Da Pianificare': 'amber',
    'Da Ripianificare': 'rose',
    'Da Assegnare': 'slate',
};

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

    // Extract colors in order of data
    const chartColors = data.map(item => colorMap[item.name] || 'gray');

    return (
        <Card className="col-span-1 shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200/60 transition-all hover:shadow-xl">
            <CardHeader>
                <CardTitle>Stato Gestione</CardTitle>
                <CardDescription>Avanzamento operativo dei lavori</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center p-2">
                <DonutChart
                    className="mt-2"
                    data={data}
                    category="value"
                    index="name"
                    valueFormatter={valueFormatter}
                    colors={chartColors}
                    variant="pie"
                />
                <div className="mt-2 w-full flex justify-center scale-75">
                    <Legend
                        categories={data.map((item) => item.name)}
                        colors={chartColors}
                        className="max-w-full justify-center"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
