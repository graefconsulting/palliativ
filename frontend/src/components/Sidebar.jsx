import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
    LayoutDashboard,
    CalendarDays,
    CalendarClock,
    Palmtree,
    Clock,
    UserSquare2,
    Users,
    BarChart3,
    HeartPulse,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const isAdminOrLeitung = user?.app_role === 'admin' || user?.app_role === 'leitung';
    const isAdmin = user?.app_role === 'admin';

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: true },
        { label: 'Dienstplan', path: '/roster', icon: CalendarDays, show: true },
        { label: 'Mein Dienstplan', path: '/my-roster', icon: CalendarClock, show: true },
        { label: 'Urlaubsplaner', path: '/vacation', icon: Palmtree, show: true },
        { label: 'Meine Verfügbarkeit', path: '/availability', icon: Clock, show: true },
        { label: 'Meine Übersicht', path: '/my-overview', icon: UserSquare2, show: true },

        // Admin & Leitung
        { label: 'Mitarbeiterverwaltung', path: '/employees', icon: Users, show: isAdminOrLeitung },
        { label: 'Rufdienst-Auswertung', path: '/reports/oncall', icon: BarChart3, show: isAdminOrLeitung },
        { label: 'Krankheits-Auswertung', path: '/reports/illness', icon: HeartPulse, show: isAdminOrLeitung },
        { label: 'Freigaben & Abrechnung', path: '/approvals', icon: ClipboardList, show: isAdminOrLeitung },

        // Nur Admin
        { label: 'Dienstarten verwalten', path: '/shift-settings', icon: Settings, show: isAdmin },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Mobile Header & Hamburger */}
            <div className="md:hidden flex items-center justify-between bg-brand-sidebar p-4 border-b border-brand-border h-16 w-full fixed top-0 z-20">
                <img
                    src="/assets/palliativteam-hochtaunus-logo-klein.png.webp"
                    alt="Palliativteam Hochtaunus"
                    className="h-8 object-contain"
                />
                <button onClick={() => setIsOpen(!isOpen)} className="text-brand-text">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-30 w-64 bg-brand-sidebar border-r border-brand-border transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 flex justify-center items-center h-20 border-b border-brand-border md:flex hidden">
                    <img
                        src="/assets/palliativteam-hochtaunus-logo-klein.png.webp"
                        alt="Palliativteam Hochtaunus"
                        className="max-h-12 w-auto object-contain"
                    />
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                        {navItems.filter(item => item.show).map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-brand-primary text-white"
                                            : "text-brand-text hover:bg-brand-primary/10 hover:text-brand-dark"
                                    )}
                                >
                                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-brand-border">
                    <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-brand-text truncate">{user?.name}</p>
                            <p className="text-xs text-brand-text-sec truncate capitalize">{user?.app_role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Abmelden
                    </button>
                </div>
            </div>
        </>
    );
}
