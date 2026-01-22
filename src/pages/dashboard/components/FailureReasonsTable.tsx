
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface FailureReasonsTableProps {
    data: {
        reason: string;
        count: number;
        percentage: number;
    }[];
}

export function FailureReasonsTable({ data }: FailureReasonsTableProps) {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <Card className="col-span-1 md:col-span-2 border-amber-200/50 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/10">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <CardTitle className="text-base font-medium text-amber-950 dark:text-amber-100">
                    Analisi Esiti Negativi
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border bg-background/50">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Motivazione Fallimento</TableHead>
                                <TableHead className="text-right">Quantità</TableHead>
                                <TableHead className="text-right w-[100px]">%</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">{item.reason}</TableCell>
                                    <TableCell className="text-right font-bold">{item.count}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{item.percentage.toFixed(1)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
