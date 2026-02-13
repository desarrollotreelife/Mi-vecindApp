import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Car,
    LogOut,
    Building2,
    Calendar,
    ShoppingCart,
    Scan,
    BookOpen,
    MessageSquare,
    FileText,
    Vote,
    PieChart,
    CreditCard,
    ShieldCheck,
    Menu,
    Megaphone,
    Package
} from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const roleName = typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role?.name?.toLowerCase() || '';

    const navItems = [
        // Admin sees everything (or default)
        ...(!['guard', 'vigilante'].includes(roleName) ? [{ name: 'Inicio', icon: LayoutDashboard, path: '/' }] : []),

        // Guard Main Tab
        ...(['guard', 'vigilante'].includes(roleName) ? [{ name: 'Terminal Acceso', icon: ShieldCheck, path: '/access-terminal' }] : []),

        { name: 'Residentes', icon: Users, path: '/residents' },
        { name: 'Visitantes', icon: Calendar, path: '/visits' },

        // Reception Module (New)
        ...(['guard', 'vigilante', 'admin'].includes(roleName) ? [{ name: 'Portería', icon: Package, path: '/reception' }] : []),

        ...((['guard', 'admin', 'vigilante', 'celador'].includes(roleName)) ? [{ name: 'Bitácora', icon: BookOpen, path: '/logbook' }] : []),
        { name: 'Parqueadero', icon: Car, path: '/parking' },
        { name: 'Amenidades', icon: Building2, path: '/amenities' },
        { name: 'Tienda', icon: ShoppingCart, path: '/store' },

        // Access Terminal for Admin (Guard has it at top)
        ...(!['guard', 'vigilante'].includes(roleName) ? [{ name: 'Terminal Acceso', icon: Scan, path: '/access-terminal' }] : []),

        // Config ONLY for admin
        ...(roleName === 'admin' ? [
            { name: 'Propiedades', icon: Building2, path: '/units' },
            { name: 'Configuración', icon: ShieldCheck, path: '/config' }
        ] : []),

        // Guard needs Communications
        { name: 'Comunicados', icon: Megaphone, path: '/communications' },

        // Admin Modules
        ...(!['guard', 'vigilante'].includes(roleName) ? [
            { name: 'PQRS', icon: MessageSquare, path: '/pqrs' },
            { name: 'Actas', icon: FileText, path: '/documents' },
            { name: 'Votaciones', icon: Vote, path: '/voting' },
            { name: 'Finanzas', icon: PieChart, path: '/finance' },
            { name: 'Pagos', icon: CreditCard, path: '/payments' },
            { name: 'SaaS Admin', icon: Building2, path: '/super-admin' },
        ] : []),
    ];

    return (
        <>
            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? 240 : 80,
                    x: isOpen ? 0 : 0 // On desktop we change width, on mobile we might want to translate... handled by CSS for simplicity or mixed approach?
                }}
                transition={{ duration: 0.3 }}
                className={clsx(
                    "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 flex flex-col shadow-sm h-screen",
                    // Mobile Styles: Fixed, Full Height, Transform
                    "fixed inset-y-0 left-0 md:static",
                    !isOpen && "hidden md:flex", // On mobile, if not open, hide it. On desktop, flex (collapsed width handled by motion)
                    isOpen && "flex" // On mobile, if open, show it.
                )}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    {isOpen && (
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">CONJUNTOS</span>
                            <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400 tracking-wide">By simids</span>
                        </div>
                    )}
                    <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {!isOpen && <Menu size={20} />}
                        {isOpen && <div className="text-xs font-medium text-slate-400">v1.0</div>}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                                isActive
                                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <item.icon size={20} className={clsx("flex-shrink-0", isOpen ? "" : "mx-auto")} />
                            {isOpen && <span>{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors",
                            !isOpen && "md:justify-center"
                        )}>
                        <LogOut size={20} />
                        {isOpen && <span>Cerrar Sesión</span>}
                    </button>

                    {isOpen && (
                        <div className="px-3 pt-2 text-[10px] text-center text-slate-400 font-mono">
                            <div className="font-semibold text-slate-600">v1.6.0</div>
                            <div className="mt-0.5">Config Module</div>
                            <div className="mt-0.5 text-slate-300">Build 20260123_2</div>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={toggle}
                />
            )}
        </>
    );
};
