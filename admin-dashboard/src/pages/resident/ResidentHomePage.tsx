import React, { useEffect, useState } from 'react';
import { Calendar, ShoppingBag, CreditCard, Bell, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const ResidentHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [parkingSummary, setParkingSummary] = useState<{ available: number, occupied: number } | null>(null);

    useEffect(() => {
        const fetchParkingStatus = async () => {
            try {
                const response = await api.get('/parking/status');
                if (response.data && response.data.summary) {
                    setParkingSummary(response.data.summary);
                }
            } catch (error) {
                console.error('Error fetching parking status:', error);
            }
        };
        fetchParkingStatus();
    }, []);

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-emerald-100 text-sm font-medium">Saldo Pendiente</p>
                        <h2 className="text-3xl font-bold mt-1">$125.000</h2>
                    </div>
                    <CreditCard className="text-emerald-200" size={24} />
                </div>
                <div className="flex justify-between items-center text-sm">
                    <p className="text-emerald-100">Vence: 05 Feb</p>
                    <button
                        onClick={() => navigate('/resident/payments')}
                        className="bg-white hover:bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors"
                    >
                        Pagar Ahora
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/resident/visits')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Anunciar Visita</span>
                </button>

                <button
                    onClick={() => navigate('/resident/amenities')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag size={24} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Reservar Zona</span>
                </button>

                {/* Parking Display */}
                <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Car size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Parqueadero</span>
                    </div>

                    <div className="text-right">
                        {parkingSummary ? (
                            <div>
                                <span className={`text-2xl font-bold ${parkingSummary.available > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {parkingSummary.available}
                                </span>
                                <span className="text-xs text-slate-500 block">Libres</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Cargando...</span>
                        )}
                    </div>
                </div>
            </div>


            {/* Notifications / News */}
            <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 ml-1 flex items-center gap-2">
                    <Bell size={16} className="text-emerald-500" /> Novedades
                </h3>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
                    <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">Corte de Agua Programado</p>
                            <p className="text-xs text-slate-500 mt-0.5">Mañana de 8:00 AM a 12:00 PM por mantenimiento.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">Paquete Recibido</p>
                            <p className="text-xs text-slate-500 mt-0.5">Tienes un paquete en portería.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
