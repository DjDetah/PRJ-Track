import { ImportSection } from '../../components/settings/ImportSection';

export default function ImportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importazione Dati</h1>
                <p className="text-muted-foreground">Carica dati massivi da file Excel.</p>
            </div>
            <ImportSection />
        </div>
    );
}
