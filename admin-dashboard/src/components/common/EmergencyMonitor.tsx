import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Phone, User, Home, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, joinComplexRoom } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const EmergencyMonitor: React.FC = () => {
    const { user } = useAuth();
    const [currentAlert, setCurrentAlert] = useState<any>(null);

    useEffect(() => {
        if (!user || !user.complex_id) return;

        const socket = getSocket();
        joinComplexRoom(user.complex_id);

        socket.on('emergency_alert', (alert: any) => {
            console.log('🚨 EMERGENCY ALERT RECEIVED:', alert);
            setCurrentAlert(alert);
            playSiren();

            // Text to speech for immediate awareness
            const msg = new SpeechSynthesisUtterance(`Alerta de emergencia en unidad ${alert.unit}. Residente ${alert.resident}.`);
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);
        });

        return () => {
            socket.off('emergency_alert');
        };
    }, [user]);

    const playSiren = () => {
        // Create a basic siren sound using Browser Audio API (Beep oscillator)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 2); // Play for 2 seconds
    };

    const handleAcknowledge = async () => {
        if (!currentAlert) return;
        try {
            await api.patch(`/emergency/${currentAlert.id}/resolve`, {
                notes: 'Atendido inmediatamente desde el Command Center.'
            });
            setCurrentAlert(null);
            window.speechSynthesis.cancel();
        } catch (error) {
            console.error('Error resolving alert:', error);
            setCurrentAlert(null);
        }
    };

    if (!currentAlert) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-600/90 backdrop-blur-xl">
                {/* Flashing Background Animation */}
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute inset-0 bg-red-700 pointer-events-none"
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative bg-white w-full max-w-2xl mx-10 rounded-[40px] shadow-[0_0_100px_rgba(255,0,0,0.5)] overflow-hidden border-8 border-white"
                >
                    <div className="bg-red-600 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white text-red-600 rounded-3xl animate-pulse">
                                <ShieldAlert size={48} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter">Emergencia S.O.S</h1>
                                <p className="text-red-100 font-bold opacity-80">ALERTA DE PÁNICO ACTIVA</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-black opacity-60">ID Alerta</p>
                            <p className="text-2xl font-mono">#{currentAlert.id}</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1">
                                    <User size={12} /> Residente
                                </p>
                                <p className="text-xl font-bold text-slate-900">{currentAlert.resident}</p>
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                                    <Phone size={14} /> {currentAlert.phone || 'Sin teléfono'}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1">
                                    <Home size={12} /> Ubicación
                                </p>
                                <p className="text-xl font-bold text-slate-900">Unidad {currentAlert.unit}</p>
                                <p className="text-sm text-slate-500 font-medium mt-1">Bloque/Torre Detectada</p>
                            </div>
                        </div>

                        {/* Geolocation Section */}
                        {currentAlert.location?.lat && (
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 text-white rounded-2xl">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-blue-900 text-lg">Geolocalización GPS</p>
                                        <p className="text-sm text-blue-700">Precisión: {Math.round(currentAlert.location.accuracy || 0)}m</p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${currentAlert.location.lat},${currentAlert.location.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-colors"
                                >
                                    VER EN MAPA
                                </a>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleAcknowledge}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100"
                            >
                                <CheckCircle size={28} /> ATENDER AHORA
                            </button>
                            <button
                                onClick={() => setCurrentAlert(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-8 rounded-3xl font-bold text-sm transition-all"
                            >
                                DESCARTAR
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <AlertTriangle size={12} /> Procedimiento de seguridad activado automáticamente
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
