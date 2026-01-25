
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { BarList } from '@tremor/react';

interface FailureReasonsTableProps {
    data: {
        reason: string;
        count: number;
        percentage: number;
    }[];
}

const valueFormatter = (number: number) => `${number}`;

export function FailureReasonsTable({ data }: FailureReasonsTableProps) {
    if (!data || data.length === 0) {
        return null;
    }

    const barListData = data.map(item => ({
        name: item.reason,
        value: item.count,
    }));

    return (
        <Card className="col-span-1 border-slate-200/60 shadow-lg shadow-slate-200/50 dark:shadow-none">
            <CardHeader className="pb-3">
                <CardTitle>Analisi Esiti Negativi</CardTitle>
                <CardDescription>Dettaglio motivazioni fallimento (NON OK)</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <BarList
                    data={barListData}
                    valueFormatter={valueFormatter}
                    color="rose"
                    className="mt-2"
                />
            </CardContent>
        </Card>
    );
}
