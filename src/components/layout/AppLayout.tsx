import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import {
    LayoutDashboard,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    User,
    Bell,
    FolderKanban,
    ScrollText
} from 'lucide-react';
import { Button } from '../ui/button';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Work Orders', path: '/work-orders', icon: ClipboardList },
        { name: 'Progetti', path: '/projects', icon: FolderKanban },
        { name: 'Listini', path: '/lists', icon: ScrollText }, // Add Listini
        { name: 'Import Excel', path: '/import', icon: Settings }, // Changed Settings to generic import for now
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 flex font-sans">
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
                <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden md:flex"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        {/* Mobile Menu Toggle could accept more work here */}
                        <span className="font-semibold text-lg md:hidden">Enterprise App</span>
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
                            <p className="text-sm font-medium leading-none">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">Operator</p>
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
