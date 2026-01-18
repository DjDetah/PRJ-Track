import { useEffect, useState } from 'react';
import { priceListService } from '../../services/priceListService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { ScrollText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';

// Helper type for Price List Header
interface PriceListHeader {
    id: string;
    name: string;
    type: 'Consuntivo' | 'Fornitore';
    is_default: boolean;
    created_at: string;
}

export default function PriceListsPage() {
    const [listini, setListini] = useState<PriceListHeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Service returns objects with listino/tipo aliases, but we should prefer native properties
            const data = await priceListService.getUniqueListini();
            // Cast to our expected type, assuming service returns compatible objects
            setListini(data as unknown as PriceListHeader[]);
        } catch (err: any) {
            console.error(err);
            setErrorMsg('Errore nel caricamento dei listini.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSetDefault = async (name: string, type: 'Consuntivo' | 'Fornitore', currentVal: boolean) => {
        if (currentVal) return; // Already default

        try {
            await priceListService.setAsDefault(name, type);
            await loadData();
        } catch (err: any) {
            console.error(err);
            setErrorMsg('Errore nell\'impostazione del default: ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestione Listini</h1>
                <p className="text-muted-foreground">Visualizza e configura i listini prezzi per Clienti e Fornitori.</p>
            </div>

            {errorMsg && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errore</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-primary" />
                        Listini Disponibili
                    </CardTitle>
                    <CardDescription>
                        Elenco dei listini importati a sistema. Utilizza lo switch per definire il listino di default per ogni tipologia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome Listino</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Data Importazione</TableHead>
                                <TableHead className="text-right">Default</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Caricamento...
                                    </TableCell>
                                </TableRow>
                            ) : listini.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Nessun listino presente. Importane uno dalla pagina Import.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                listini.map((l) => (
                                    <TableRow key={`${l.name}-${l.type}`}>
                                        <TableCell className="font-medium">{l.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={l.type === 'Consuntivo' ? 'default' : 'secondary'}>
                                                {l.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Switch
                                                    checked={l.is_default}
                                                    onCheckedChange={(checked) => handleSetDefault(l.name, l.type, !checked)}
                                                    disabled={l.is_default}
                                                />
                                                {l.is_default && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Attivo</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
