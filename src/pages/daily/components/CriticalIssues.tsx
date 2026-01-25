import { AlertTriangle } from 'lucide-react';

interface CriticalIssuesProps {
    issuesCount: number;
}

export function CriticalIssues({ issuesCount }: CriticalIssuesProps) {
    if (issuesCount === 0) {
        return (
            <div className="h-full flex flex-col justify-center items-center bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-xl">😊</span>
                    </div>
                </div>
                <h3 className="text-green-800 dark:text-green-300 font-bold text-sm">Tutto OK</h3>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col justify-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                <AlertTriangle className="h-24 w-24 text-red-600" />
            </div>

            <div className="flex items-center gap-3 z-10">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center animate-pulse shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">
                            {issuesCount}
                        </span>
                        <span className="text-red-800 dark:text-red-300 font-bold text-xs uppercase tracking-tight">Criticità</span>
                    </div>
                    <p className="text-red-600/80 dark:text-red-400/80 text-[10px] leading-tight mt-0.5">
                        Interventi NON OK oggi
                    </p>
                </div>
            </div>
        </div>
    );
}
