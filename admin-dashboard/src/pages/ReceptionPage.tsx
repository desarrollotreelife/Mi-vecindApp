import React, { useState, useEffect } from 'react';
import { Package, Zap, Droplets, Flame, Search, History, CheckCircle, Clock, ShieldCheck, Camera } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { VCardScanner } from '../components/common/VCardScanner';

interface Correspondence {
    id: number;
    unit: {
        block: string;
        number: string;
    };
    type: string;
    sender?: string;
    description?: string;
    locker_number?: string;
    pickup_pin?: string;
    status: 'pending' | 'delivered';
    received_at: string;
}

export const ReceptionPage: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // States
    const [units, setUnits] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [correspondenceList, setCorrespondenceList] = useState<Correspondence[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [deliveryPins, setDeliveryPins] = useState<{ [id: number]: string }>({});

    // LPR Simulation
    const [simulatedPlate, setSimulatedPlate] = useState('');
    const [lprResult, setLprResult] = useState<{ allowed: boolean; message: string } | null>(null);

    // Receipt form details
    const [sender, setSender] = useState('');
    const [description, setDescription] = useState('');
    const [lockerNumber, setLockerNumber] = useState('');

    useEffect(() => {
        fetchUnits();
        fetchCorrespondence();
    }, []);

    const fetchUnits = async () => {
        try {
            const res = await api.get('/units');
            setUnits(res.data);
        } catch (err) {
            console.error("Error fetching units", err);
        }
    };

    const fetchCorrespondence = async () => {
        try {
            const res = await api.get('/correspondence', { params: { status: 'pending' } });
            setCorrespondenceList(res.data);
        } catch (err) {
            console.error("Error fetching correspondence", err);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedUnit(null);
    };

    const filteredUnits = units.filter(u =>
        `${u.block || ''} ${u.number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.residents && u.residents.some((r: any) => r.full_name.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleRegisterReceipt = async (type: string, label: string) => {
        if (!selectedUnit) return;

        setLoading(true);
        try {
            await api.post('/correspondence', {
                unitId: selectedUnit.id,
                type,
                sender: sender || label,
                description,
                lockerNumber: lockerNumber || undefined
            });

            // Success
            setSender('');
            setDescription('');
            setLockerNumber('');
            fetchCorrespondence();

            // Speak confirmation
            const utterance = new SpeechSynthesisUtterance(`Correspondencia registrada para la unidad ${selectedUnit.number}`);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            alert('Error al registrar correspondencia');
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async (item: Correspondence) => {
        try {
            if (item.locker_number) {
                const pinToVerify = deliveryPins[item.id];
                if (!pinToVerify) {
                    alert('Este paquete está en un Smart Locker. Por favor ingrese el PIN generado.');
                    return;
                }
                await api.post(`/correspondence/${item.id}/verify-pickup`, { pin: pinToVerify });
            } else {
                await api.patch(`/correspondence/${item.id}/deliver`);
            }

            // Clear pin field for this item
            setDeliveryPins(prev => {
                const newPins = { ...prev };
                delete newPins[item.id];
                return newPins;
            });
            fetchCorrespondence();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al procesar la entrega');
        }
    };

    const handleLPRSimulate = async () => {
        if (!simulatedPlate) return;
        setLoading(true);
        try {
            const res = await api.post('/access/lpr-webhook', {
                plate: simulatedPlate.toUpperCase(),
                camera_id: 'SIM_CAM_01'
            });
            setLprResult(res.data);

            // Speak result
            const utterance = new SpeechSynthesisUtterance(res.data.allowed ? 'Acceso Autorizado Vehículo' : 'Acceso Denegado Vehículo');
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);

            setTimeout(() => setLprResult(null), 5000);
            setSimulatedPlate('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error en LPR Simulator');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Package className="text-blue-500" />
                    Control de Portería y Correspondencia
                </h1>
                <button
                    onClick={() => setShowScanner(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <ShieldCheck size={20} />
                    Escanear V-Card
                </button>
            </div>

            {showScanner && <VCardScanner onClose={() => setShowScanner(false)} />}

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Left: Search & Unit Selection */}
                <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar Apto..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                            />
                        </div>
                    </div>

                    <div className={`flex-1 overflow-y-auto rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-2 custom-scrollbar`}>
                        {filteredUnits.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No se encontraron unidades</div>
                        ) : (
                            filteredUnits.map(unit => (
                                <div
                                    key={unit.id}
                                    onClick={() => setSelectedUnit(unit)}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors border ${selectedUnit?.id === unit.id
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                        : isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className="font-bold">
                                        {unit.block ? `${unit.block} - ` : ''} {unit.number}
                                    </div>
                                    <div className={`text-xs ${selectedUnit?.id === unit.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {unit.residents?.[0]?.full_name || 'Sin residente'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Center: Actions */}
                <div className="col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {!selectedUnit ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 bg-slate-100/30 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Search size={64} className="mb-4 text-slate-300" />
                            <p className="text-xl font-medium text-slate-400">Seleccione una unidad</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
                                <h2 className="text-2xl font-black mb-4 flex justify-between items-center">
                                    <span>{selectedUnit.block ? `Bloque ${selectedUnit.block} - ` : ''}Apto {selectedUnit.number}</span>
                                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Destino Seleccionado</span>
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Empresa de Envío / Remitente</label>
                                        <input
                                            value={sender}
                                            onChange={e => setSender(e.target.value)}
                                            placeholder="Ej: Servientrega, Amazon, TCC..."
                                            className={`w-full p-2 mt-1 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Descripción / Observación</label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Ej: Paquete mediano, sobre manila..."
                                            className={`w-full p-2 mt-1 rounded-lg border outline-none resize-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Casilla Smart Locker (Opcional)</label>
                                        <input
                                            value={lockerNumber}
                                            onChange={e => setLockerNumber(e.target.value)}
                                            placeholder="Ej: A-12, L-05"
                                            className={`w-full p-2 mt-1 rounded-lg border outline-none font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleRegisterReceipt('package', 'Paquete')}
                                        disabled={loading}
                                        className="col-span-2 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 font-bold text-lg"
                                    >
                                        <Package size={28} />
                                        Registrar Encomienda / Paquete
                                    </button>

                                    <button
                                        onClick={() => handleRegisterReceipt('invoice', 'Recibo de Agua')}
                                        disabled={loading}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-cyan-500 ${isDark ? 'border-slate-700 hover:bg-cyan-900/20' : 'border-slate-100 hover:bg-cyan-50'}`}
                                    >
                                        <Droplets className="text-cyan-500" size={24} />
                                        <span className="text-xs font-bold uppercase">Recibo Agua</span>
                                    </button>

                                    <button
                                        onClick={() => handleRegisterReceipt('invoice', 'Recibo de Luz')}
                                        disabled={loading}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-yellow-500 ${isDark ? 'border-slate-700 hover:bg-yellow-900/20' : 'border-slate-100 hover:bg-yellow-50'}`}
                                    >
                                        <Zap className="text-yellow-500" size={24} />
                                        <span className="text-xs font-bold uppercase">Recibo Luz</span>
                                    </button>

                                    <button
                                        onClick={() => handleRegisterReceipt('invoice', 'Recibo de Gas')}
                                        disabled={loading}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-orange-500 ${isDark ? 'border-slate-700 hover:bg-orange-900/20' : 'border-slate-100 hover:bg-orange-50'}`}
                                    >
                                        <Flame className="text-orange-500" size={24} />
                                        <span className="text-xs font-bold uppercase">Recibo Gas</span>
                                    </button>

                                    <button
                                        onClick={() => handleRegisterReceipt('letter', 'Correspondencia')}
                                        disabled={loading}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-slate-400 ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        <History className="text-slate-500" size={24} />
                                        <span className="text-xs font-bold uppercase">Otro / Carta</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LPR SIMULATOR SECTION */}
                    <div className={`p-6 rounded-2xl border flex-shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg mt-6'}`}>
                        <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                            <Camera className="text-purple-500" /> Webhook LPR Simulator
                        </h2>
                        <div className="flex gap-4 items-center">
                            <input
                                value={simulatedPlate}
                                onChange={e => setSimulatedPlate(e.target.value)}
                                placeholder="Ej: ABC-123"
                                className={`flex-1 p-3 rounded-xl border outline-none uppercase font-mono text-lg tracking-widest ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            />
                            <button
                                onClick={handleLPRSimulate}
                                disabled={loading || !simulatedPlate}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                            >
                                Simular Captura
                            </button>
                        </div>
                        {lprResult && (
                            <div className={`mt-4 p-4 rounded-xl border ${lprResult.allowed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                <h4 className="font-bold flex items-center gap-2">
                                    {lprResult.allowed ? <CheckCircle size={20} /> : <Zap size={20} />}
                                    {lprResult.allowed ? 'Acceso Permitido' : 'Acceso Denegado'}
                                </h4>
                                <p className="text-sm mt-1">{lprResult.message}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Pending Deliveries */}
                <div className="col-span-4 overflow-hidden flex flex-col">
                    <div className={`flex-1 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col overflow-hidden`}>
                        <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                            <h3 className="font-black flex items-center gap-2 text-sm uppercase tracking-tighter text-blue-500">
                                <Clock size={16} />
                                Paquetes por Entregar ({correspondenceList.length})
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {correspondenceList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40">
                                    <CheckCircle size={48} className="mb-2" />
                                    <p className="text-sm font-medium">Todo al día</p>
                                </div>
                            ) : (
                                correspondenceList.map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-xl border group hover:shadow-md transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-black text-blue-500 uppercase text-xs">Apto {item.unit.number}</div>
                                                <div className="font-bold text-lg leading-tight">{item.sender}</div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {item.description && (
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
                                        )}

                                        {item.locker_number && (
                                            <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Locker {item.locker_number}</span>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    placeholder="PIN del residente"
                                                    value={deliveryPins[item.id] || ''}
                                                    onChange={e => setDeliveryPins({ ...deliveryPins, [item.id]: e.target.value })}
                                                    className="w-32 px-2 py-1 text-xs font-mono font-bold text-center border rounded-md dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleDeliver(item)}
                                            className="w-full py-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} />
                                            {item.locker_number ? 'Verificar PIN y Entregar' : 'Marcar como Entregado'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
