import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const WelcomeBanner: React.FC = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [availableShifts, setAvailableShifts] = useState<any[]>([]);
    const [selectedShift, setSelectedShift] = useState<string | null>(() => localStorage.getItem('currentShift'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedShift) {
            setIsVisible(false);
            return;
        }

        const fetchShifts = async () => {
            try {
                const res = await api.get('/config/shifts');
                const sortedShifts = res.data.sort((a: any, b: any) => b.name.localeCompare(a.name));
                setAvailableShifts(sortedShifts);
            } catch (err) {
                console.error('Error fetching shifts:', err);
                // Mock for demo if API fails
                setAvailableShifts([
                    { id: 1, name: 'Mañana', start_time: '06:00', end_time: '14:00' },
                    { id: 2, name: 'Tarde', start_time: '14:00', end_time: '22:00' },
                    { id: 3, name: 'Noche', start_time: '22:00', end_time: '06:00' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchShifts();
    }, [selectedShift]);

    const handleShiftSelect = (shiftName: string) => {
        setSelectedShift(shiftName);
        // Persist selection for future visits locally (per device)
        localStorage.setItem('currentShift', shiftName);

        // Auto close after confirmation
        setTimeout(() => {
            setIsVisible(false);
        }, 1500);
    };

    if (!isVisible || !user) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="relative z-10 w-full max-w-lg mx-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    ¡Bienvenido!
                                </h3>
                                <div className="text-blue-100 text-lg">
                                    {user.full_name || user.nombre || user.username || 'Usuario'}
                                </div>
                            </div>

                            <div className="p-8 text-center bg-slate-50">
                                {(['guard', 'vigilante', 'celador'].includes(user.role?.name?.toLowerCase() || '') || (typeof user.role === 'string' && ['guard', 'vigilante', 'celador'].includes(user.role.toLowerCase()))) ? (
                                    // Shift Selection for Guards
                                    !selectedShift ? (
                                        <>
                                            <p className="text-gray-500 mb-6 font-medium text-lg">Por favor selecciona tu turno:</p>

                                            {loading ? (
                                                <div className="text-gray-400">Cargando turnos...</div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {availableShifts.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleShiftSelect(s.name)}
                                                            className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-slate-700 hover:text-blue-700 flex flex-col items-center gap-1 group"
                                                        >
                                                            <span className="text-lg">{s.name}</span>
                                                            <span className="text-xs text-slate-400 group-hover:text-blue-400 font-normal">
                                                                {s.start_time} - {s.end_time}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {availableShifts.length === 0 && !loading && (
                                                <div className="text-red-500 text-sm">No hay turnos activos configurados.</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-4">
                                            <div className="mb-4 text-green-500">
                                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800">Turno {selectedShift} Iniciado</h4>
                                            <p className="text-gray-500 mt-2">Que tengas una excelente jornada.</p>
                                        </div>
                                    )
                                ) : (
                                    // Simple Welcome for Others
                                    <div className="py-6">
                                        <p className="text-slate-600 text-lg mb-4">
                                            Bienvenido al sistema.
                                        </p>
                                        <button
                                            onClick={() => setIsVisible(false)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Continuar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-2 right-2 text-white/50 hover:text-white p-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
