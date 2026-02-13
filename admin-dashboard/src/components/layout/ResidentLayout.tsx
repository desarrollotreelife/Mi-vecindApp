import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, CreditCard, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageHelper';

export const ResidentLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                        {user?.profile_photo ? (
                            <img
                                src={getImageUrl(user.profile_photo)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                {user?.full_name?.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-800 leading-tight">Hola, {user?.full_name?.split(' ')[0]}</h1>
                        <p className="text-xs text-slate-500">Apto {user?.unit_id || '---'}</p>
                    </div>
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                    <Menu size={24} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 pb-20 overflow-y-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-safe z-40">
                <div className="flex justify-around items-center h-16">
                    <NavLink
                        to="/resident"
                        end
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400'}`
                        }
                    >
                        <Home size={20} />
                        <span className="text-[10px] font-medium">Inicio</span>
                    </NavLink>
                    <NavLink
                        to="/resident/visits"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400'}`
                        }
                    >
                        <Calendar size={20} />
                        <span className="text-[10px] font-medium">Visitas</span>
                    </NavLink>
                    <NavLink
                        to="/resident/store"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400'}`
                        }
                    >
                        <ShoppingBag size={20} />
                        <span className="text-[10px] font-medium">Tienda</span>
                    </NavLink>
                    <NavLink
                        to="/resident/payments"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400'}`
                        }
                    >
                        <CreditCard size={20} />
                        <span className="text-[10px] font-medium">Pagos</span>
                    </NavLink>
                </div>
            </nav>

            {/* Slide-out Menu (Optional for more settings) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6">Menú</h2>
                        <div className="space-y-4 flex-1">
                            <button className="flex items-center gap-3 text-slate-600 w-full p-2 hover:bg-slate-50 rounded-lg">
                                <User size={20} /> Perfil
                            </button>
                            {/* Add more items here */}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 text-red-600 w-full p-2 hover:bg-red-50 rounded-lg mt-auto"
                        >
                            <LogOut size={20} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
