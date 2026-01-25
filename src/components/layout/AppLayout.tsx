import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import {
    LayoutDashboard,
    CalendarDays, // Imported
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    User,
    Bell,
    FolderKanban
} from 'lucide-react';
import { Button } from '../ui/button';
import { userService } from '../../services/userService';
import { useEffect } from 'react';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<{ full_name?: string | null, role?: string | null } | null>(null);

    useEffect(() => {
        if (user) {
            userService.getAll().then(users => {
                const me = users?.find(u => u.id === user.id);
                if (me) setProfile(me);
            });
        }
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Daily', path: '/daily', icon: CalendarDays }, // Changed Icon
        { name: 'Work Orders', path: '/work-orders', icon: ClipboardList },
        { name: 'Progetti', path: '/projects', icon: FolderKanban },
        { name: 'Impostazioni', path: '/settings', icon: Settings },
    ];

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return { title: 'Dashboard', subtitle: 'Panoramica attività' };
            case '/daily':
                return { title: 'Daily', subtitle: 'Pianificazione giornaliera' };
            case '/work-orders':
                return { title: 'Work Orders', subtitle: 'Gestione interventi' };
            case '/projects':
                return { title: 'Progetti', subtitle: 'Gestione commesse' };
            case '/settings':
                return { title: 'Impostazioni', subtitle: 'Configurazione sistema' };
            case '/import': // Assuming this route might exist or be added
                return { title: 'Import', subtitle: 'Importazione dati' };
            default:
                if (location.pathname.startsWith('/projects/')) return { title: 'Dettaglio Progetto', subtitle: 'Scheda tecnica' };
                if (location.pathname.startsWith('/work-orders/')) return { title: 'Dettaglio Work Order', subtitle: 'Scheda intervento' };
                return { title: '', subtitle: '' };
        }
    };

    const pageInfo = getPageTitle();

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-900 flex font-sans">
            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "hidden md:flex flex-col w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
                    !sidebarOpen && "w-20"
                )}
            >
                <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                            E
                        </div>
                        {sidebarOpen && <span>Enterprise</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                                    !sidebarOpen && "justify-center"
                                )}
                                title={!sidebarOpen ? item.name : undefined}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {sidebarOpen && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20", !sidebarOpen && "justify-center px-0")}
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span className="ml-2">Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden md:flex"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="flex flex-col justify-center">
                            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{pageInfo.title}</h1>
                            {pageInfo.subtitle && (
                                <p className="text-[10px] text-muted-foreground leading-tight">{pageInfo.subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-medium leading-none">
                                {profile?.full_name || user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {profile?.role || 'Guest'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
