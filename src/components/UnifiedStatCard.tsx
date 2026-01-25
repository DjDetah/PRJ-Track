import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '../utils/cn';

interface UnifiedStatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string; // e.g. "text-blue-600"
    bgColor: string; // e.g. "bg-blue-100"
    onClick?: () => void;
    isActive?: boolean;
    className?: string;
}

export function UnifiedStatCard({ title, value, icon: Icon, color, bgColor, onClick, isActive, className }: UnifiedStatCardProps) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer",
                "h-[110px]", // Fixed height to match "Dashboard" (compact but enough for Daily style)
                isActive ? "ring-2 ring-primary ring-offset-2" : "",
                className
            )}
        >
            <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <p className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-widest leading-tight whitespace-normal mr-2">
                        {title}
                    </p>
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        bgColor
                    )}>
                        <Icon className={cn("h-4 w-4", color)} />
                    </div>
                </div>
                <div className="mt-1">
                    <p className="text-22px font-black tracking-tighter text-slate-900 dark:text-white truncate">
                        {value}
                    </p>
                </div>
            </CardContent>

            {/* Decorative Circle */}
            <div className={cn(
                "absolute -bottom-4 -right-4 h-20 w-20 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500",
                bgColor
            )} />
        </Card>
    );
}
