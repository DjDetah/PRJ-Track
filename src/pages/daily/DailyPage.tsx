import { useEffect, useState } from 'react';
import { pianificazioneService } from '../../services/pianificazioneService';
import { CriticalIssues } from './components/CriticalIssues';
import { DailyStats } from './components/DailyStats';
import { DailyTable } from './components/DailyTable';
import { NextDaysPreview } from './components/NextDaysPreview';
import { Loader2 } from 'lucide-react';
// Imports removed

export default function DailyPage() {
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [nextDaysData, setNextDaysData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Today
            const today = new Date();
            const daily = await pianificazioneService.getDailyPlan(today);
            setDailyData(daily || []);

            // Load Next Days
            const next = await pianificazioneService.getNextDaysSummary();
            setNextDaysData(next || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateOutcome = async (id: string, esito: 'IN CORSO' | 'OK' | 'NON OK', motivazione?: string) => {
        // Optimistic update
        const originalData = [...dailyData];
        setDailyData(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, esito, motivazione_fallimento: motivazione || item.motivazione_fallimento };
            }
            return item;
        }));

        try {
            await pianificazioneService.updateOutcome(id, esito, motivazione);
        } catch (err) {
            console.error(err);
            setDailyData(originalData); // Revert
            alert("Errore nell'aggiornamento dell'esito.");
        }
    };

    // Calculate Stats
    const total = dailyData.length;
    const inProgress = dailyData.filter(d => d.esito === 'IN CORSO').length;
    const ok = dailyData.filter(d => d.esito === 'OK').length;
    const nonOk = dailyData.filter(d => d.esito === 'NON OK').length;

    if (loading && dailyData.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // todayLabel removed

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-6 p-2">
            {/* Using full height minus header to fit screen if possible, p-2 to reduce padding */}



            {/* Top Section: Critical Issues + Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-32 shrink-0">
                {/* Critical Issues (1 col) */}
                <div className="xl:col-span-1 h-full">
                    <CriticalIssues issuesCount={nonOk} />
                </div>

                {/* Stats Cards (4 cols) */}
                <div className="xl:col-span-4 h-full">
                    <DailyStats total={total} inProgress={inProgress} ok={ok} nonOk={nonOk} />
                </div>
            </div>

            {/* Main Content: Table + Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
                {/* Table (3 cols) */}
                <div className="xl:col-span-3 h-full min-h-0">
                    <DailyTable data={dailyData} onUpdateOutcome={handleUpdateOutcome} />
                </div>

                {/* Sidebar (1 col) */}
                <div className="xl:col-span-1 h-full min-h-0">
                    <NextDaysPreview data={nextDaysData} />
                </div>
            </div>
        </div>
    );
}
