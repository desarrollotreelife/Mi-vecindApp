import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, CreditCard, LogOut, Menu, User, AlertTriangle, X } from 'lucide-react';
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

    // --- MANUAL SOS WITH CODE VERIFICATION ---
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [sosCode, setSosCode] = useState('');
    const [sosError, setSosError] = useState('');
    const [isAlertSent, setIsAlertSent] = useState(false);

    const handleSOSClick = () => {
        setIsMenuOpen(false);
        setSosCode('');
        setSosError('');
        setIsAlertSent(false);
        setShowSOSModal(true);
    };

    const confirmSOS = async () => {
        // Verify code
        if (!user?.unit_id) {
            setSosError('Usuario sin apartamento asignado.');
            return;
        }

        if (sosCode !== user.unit_id.toString()) {
            setSosError('Código incorrecto. Ingresa tu número de apartamento.');
            return;
        }

        // Send alert
        await sendEmergencyAlert();
        setIsAlertSent(true);

        setTimeout(() => {
            setShowSOSModal(false);
            setIsAlertSent(false);
        }, 3000); // 3 sec delay before closing
    };

    const cancelSOS = () => {
        setShowSOSModal(false);
        setSosCode('');
        setSosError('');
    };

    const sendEmergencyAlert = async () => {
        try {
            // Get location if possible
            let lat, lng;
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        lat = pos.coords.latitude;
                        lng = pos.coords.longitude;
                        await fireApiCall(lat, lng);
                    },
                    async () => {
                        await fireApiCall(); // Without coords if permission denied
                    },
                    { timeout: 5000 }
                );
            } else {
                await fireApiCall();
            }
        } catch (error) {
            console.error('SOS Failed', error);
        }
    };

    const fireApiCall = async (lat?: number, lng?: number) => {
        try {
            await fetch('http://localhost:3000/api/emergency', { // Hacky fetch since api interceptor context
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    type: 'panic',
                    latitude: lat,
                    longitude: lng
                })
            });
        } catch (e) {
            console.error(e);
        }
    };
    // ----------------------------

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
            <main className="flex-1 pb-20 overflow-y-auto">
                <div className="p-4 h-full">
                    <Outlet />
                </div>
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
                            {/* Manual SOS Trigger for Testing/Fallback */}
                            <button
                                onClick={handleSOSClick}
                                className="flex items-center gap-3 text-red-600 w-full p-2 hover:bg-red-50 rounded-lg font-bold"
                            >
                                <AlertTriangle size={20} /> SOS (Pánico)
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 text-slate-600 w-full p-2 hover:bg-slate-50 rounded-lg mt-auto"
                        >
                            <LogOut size={20} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            {/* User Floating SOS Button */}
            {!showSOSModal && (
                <button
                    onClick={handleSOSClick}
                    className="fixed bottom-24 right-5 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-[0_8px_30px_rgb(220,38,38,0.4)] flex items-center justify-center z-40 active:scale-95 transition-all"
                >
                    <div className="flex flex-col items-center">
                        <AlertTriangle size={24} className="mb-0.5" />
                        <span className="text-[10px] font-bold">S.O.S</span>
                    </div>
                </button>
            )}

            {/* SOS Overlay Modal */}
            {showSOSModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-red-600 p-6 flex flex-col items-center relative">
                            <button onClick={cancelSOS} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 p-2 rounded-full">
                                <X size={20} />
                            </button>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl mb-4 animate-pulse">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-white text-center">CONFIRMAR S.O.S</h2>
                            <p className="text-red-100 text-center text-sm mt-2">
                                Para enviar la alerta a portería y administración, por favor verifica tu identidad.
                            </p>
                        </div>

                        {/* Body content based on state */}
                        <div className="p-8">
                            {!isAlertSent ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <label className="text-slate-500 font-bold uppercase text-xs tracking-wider block mb-3">
                                            Ingresa tu número de Apto / Casa
                                        </label>

                                        {/* Input Box */}
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoFocus
                                            value={sosCode}
                                            onChange={(e) => {
                                                setSosCode(e.target.value);
                                                setSosError('');
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') confirmSOS();
                                            }}
                                            placeholder="Ej: 501"
                                            className="w-full text-center text-4xl font-black text-slate-800 tracking-widest border-b-4 border-slate-200 focus:border-red-600 outline-none pb-2 transition-colors placeholder:text-slate-300"
                                        />
                                    </div>

                                    {sosError && (
                                        <p className="text-red-500 text-sm font-bold text-center animate-bounce">{sosError}</p>
                                    )}

                                    <button
                                        onClick={confirmSOS}
                                        disabled={!sosCode}
                                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95"
                                    >
                                        ACTIVAR ALERTA YA
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-4">
                                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">¡Alerta Enviada!</h3>
                                    <p className="text-slate-600 text-center">La recepción ha sido notificada de tu emergencia.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
