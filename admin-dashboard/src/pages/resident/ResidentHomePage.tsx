import React, { useEffect, useState } from 'react';
import { Calendar, CreditCard, Car, Vote, ArrowRight, Package, Droplets, Gift, Dog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const ResidentHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [parkingSummary, setParkingSummary] = useState<{ available: number, occupied: number } | null>(null);
    const [greeting, setGreeting] = useState('Hola');
    const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);

    // Simulate getting user name from auth context/local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user?.full_name?.split(' ')[0] || 'Residente';

    useEffect(() => {
        // Dynamic greeting based on time of day
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Buenos días');
        else if (hour < 18) setGreeting('Buenas tardes');
        else setGreeting('Buenas noches');

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

        const fetchResidentData = async () => {
            try {
                const response = await api.get('/residents/profile');
                if (response.data && response.data.loyalty_points) {
                    setLoyaltyPoints(response.data.loyalty_points);
                }
            } catch (error) {
                console.error('Error fetching resident profile:', error);
            }
        };

        fetchParkingStatus();
        fetchResidentData();
    }, []);

    return (
        <div className="space-y-6 pb-20 md:pb-6 relative min-h-screen">
            {/* Background decorative elements for glassmorphism effect */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
            </div>

            {/* Header Greeting */}
            <div className="pt-2">
                <p className="text-slate-500 font-medium">{greeting},</p>
                <h1 className="text-3xl font-bold font-outfit text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                    {firstName}
                </h1>
            </div>

            {/* Important Info Top Stats */}
            <div className="flex gap-3 mb-6">
                {/* Balance Card - Premium Glassmorphism */}
                <div className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-[1px] shadow-2xl shadow-indigo-900/20">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                    <div className="relative z-10 bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-md rounded-[23px] p-6 text-white border border-white/10 flex flex-col justify-between h-44">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-200/80 text-sm font-medium tracking-wide uppercase">Saldo a Pagar</p>
                                <h2 className="text-4xl font-bold font-outfit mt-1 tracking-tight">$125.000</h2>
                            </div>
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/5">
                                <CreditCard className="text-indigo-100" size={24} />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-indigo-200 text-sm">Vence el <strong className="text-white">05 Feb</strong></p>
                                <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                    Cerca a vencer
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/resident/payments')}
                                className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                Pagar Ahora
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loyalty Points Mini-Card */}
                <div className="w-[120px] relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-[1px] shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate('/resident/store')}
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                    <div className="relative z-10 p-4 text-white flex flex-col items-center justify-center text-center h-full w-full">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                            <Gift size={20} className="text-white drop-shadow-md animate-bounce" style={{ animationDuration: '2s' }} />
                        </div>
                        <span className="text-2xl font-bold font-outfit leading-none drop-shadow-md">{loyaltyPoints}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider mt-1 opacity-90">Treelifes</span>
                    </div>
                </div>
            </div>

            {/* Bento Grid - Quick Actions */}
            <h3 className="text-lg font-bold text-slate-800 font-outfit mb-3 flex items-center gap-2">
                Mi Conjunto
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Visits */}
                <button
                    onClick={() => navigate('/resident/visits')}
                    className="bg-white/70 backdrop-blur-lg p-5 rounded-3xl shadow-sm border border-white flex flex-col items-start gap-4 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group hover:-translate-y-1"
                >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform group-hover:rotate-3 shadow-inner">
                        <Calendar size={24} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <span className="text-base font-bold text-slate-800 block">Visitas</span>
                        <span className="text-xs text-slate-500 mt-0.5 block">Anunciar llegada</span>
                    </div>
                </button>

                {/* Pets */}
                <button
                    onClick={() => navigate('/resident/pets')}
                    className="col-span-2 bg-white/70 backdrop-blur-lg p-5 rounded-3xl shadow-sm border border-white flex items-center justify-between hover:shadow-xl hover:shadow-orange-500/10 transition-all group hover:-translate-y-1"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform group-hover:rotate-6 shadow-inner">
                            <Dog size={24} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <span className="text-base font-bold text-slate-800 block">Mis Mascotas</span>
                            <span className="text-xs text-slate-500 mt-0.5 block">Registro Pet ID y Vacunas</span>
                        </div>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-orange-500 transition-colors" size={20} />
                </button>

                {/* Parking - Spans 2 columns */}
                <div className="col-span-2 bg-white/70 backdrop-blur-lg p-5 rounded-3xl shadow-sm border border-white flex items-center justify-between gap-4 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner group-hover:scale-105 transition-transform">
                            <Car size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="text-base font-bold text-slate-800 block">Parqueadero</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${parkingSummary?.available ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                Disponibilidad en tiempo real
                            </span>
                        </div>
                    </div>

                    <div className="text-right bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100/50">
                        {parkingSummary ? (
                            <div className="flex flex-col items-center">
                                <span className={`text-2xl font-bold font-outfit leading-none ${parkingSummary.available > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {parkingSummary.available}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Libres</span>
                            </div>
                        ) : (
                            <div className="animate-pulse w-8 h-8 bg-slate-200 rounded-lg"></div>
                        )}
                    </div>
                </div>

                {/* Voting Card - Full Width Highlight */}
                <div className="col-span-2 mt-2">
                    <button
                        onClick={() => navigate('/resident/voting')}
                        className="w-full text-left relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-[1px] shadow-xl shadow-purple-900/20 group hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[23px] p-6 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">En Curso</p>
                                </div>
                                <h3 className="text-2xl font-bold text-white font-outfit">Asamblea Extraordinaria</h3>
                                <p className="text-purple-100/80 text-sm mt-1">Tu participación es requerida</p>
                            </div>

                            <div className="w-14 h-14 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:rotate-12">
                                <Vote size={28} />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Notifications / News */}
            <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 font-outfit flex items-center gap-2">
                        Novedades
                    </h3>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        Ver todas
                    </button>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {/* Item 1 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Droplets size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-800 text-sm">Corte de Agua</div>
                                <time className="font-medium text-xs text-slate-500">Mañana</time>
                            </div>
                            <div className="text-slate-600 text-xs">Mantenimiento de 8:00 AM a 12:00 PM.</div>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Package size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-800 text-sm">Paquete Recibido</div>
                                <time className="font-medium text-xs text-slate-500">Hace 2h</time>
                            </div>
                            <div className="text-slate-600 text-xs">Tienes un paquete esperando en portería.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

