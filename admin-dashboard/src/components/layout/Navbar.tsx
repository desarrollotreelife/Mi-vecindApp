import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut, Globe, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

interface NavbarProps {
    sidebarOpen?: boolean;
    setSidebarOpen?: (value: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const { i18n } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data: any) => {
            console.log('Notification received:', data);
            setUnreadCount(prev => prev + 1);
            toast(data.message || 'Nueva notificación', {
                icon: '🔔',
                duration: 4000
            });
            // Optional: Play sound
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket]);

    return (
        <header className="sticky top-0 z-10 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="flex h-16 items-center gap-4 px-6 justify-between">
                {/* Mobile Toggle */}
                <button
                    onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
                    className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            {user?.complex?.name || 'Panel Administrativo'}
                        </h2>
                        {user?.complex?.name && (
                            <span className="text-xs text-slate-500 font-medium">Mi VecindApp</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-slate-800 relative"
                        title="Cambiar Idioma (ES/EN)"
                    >
                        <Globe size={20} />
                        <span className="sr-only">Cambiar idioma</span>
                        <span className="absolute bottom-0 right-0 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-1 rounded-full uppercase">
                            {i18n.language || 'es'}
                        </span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                        title="Cambiar tema"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        onClick={() => setUnreadCount(0)}
                        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                        )}
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {user?.full_name || user?.nombre || 'Usuario'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {typeof user?.role === 'string' ? user.role : user?.role?.name || 'Usuario'}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold border-2 border-primary-200 dark:border-primary-800">
                            {(user?.full_name || user?.nombre || 'U').charAt(0).toUpperCase()}
                        </div>

                        <button
                            onClick={logout}
                            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
