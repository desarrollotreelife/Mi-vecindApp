import React, { useState, useEffect } from 'react';
import { Package, Zap, Droplets, Flame, Search, History, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface NotificationLog {
    id: number;
    unit: string;
    type: string; // 'package', 'utility_water', 'utility_energy', 'utility_gas'
    timestamp: Date;
    status: 'sent' | 'pending';
}

export const ReceptionPage: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // States
    const [units, setUnits] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock initial data fetch
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await api.get('/units');
                setUnits(res.data);
            } catch (err) {
                console.error("Error fetching units", err);
                // Fallback mock
                setUnits([
                    { id: 1, block: 'A', number: '101', residents: [{ full_name: 'Juan Perez' }] },
                    { id: 2, block: 'A', number: '102', residents: [{ full_name: 'Maria Gomez' }] },
                    { id: 3, block: 'B', number: '201', residents: [{ full_name: 'Carlos Diaz' }] },
                ]);
            }
        };
        fetchUnits();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedUnit(null); // Reset selection on search
    };

    const filteredUnits = units.filter(u =>
        `${u.block || ''} ${u.number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.residents && u.residents.some((r: any) => r.full_name.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleNotify = (label: string) => {
        if (!selectedUnit) return;

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            const newLog: NotificationLog = {
                id: Date.now(),
                unit: `${selectedUnit.block ? selectedUnit.block + '-' : ''}${selectedUnit.number}`,
                type: label,
                timestamp: new Date(),
                status: 'sent'
            };
            setLogs([newLog, ...logs]);
            setLoading(false);

            // Speak confirmation
            const utterance = new SpeechSynthesisUtterance(`Notificación de ${label} enviada a la unidad ${newLog.unit}`);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);

        }, 800);
    };

    return (
        <div className={`p-6 max-h-screen overflow-hidden flex flex-col ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Package className="text-blue-500" />
                Control de Portería y Correspondencia
            </h1>

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Left: Search & Unit Selection */}
                <div className="col-span-4 flex flex-col gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar Apto / Residente..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                            />
                        </div>
                    </div>

                    <div className={`flex-1 overflow-y-auto rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-2`}>
                        {filteredUnits.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No se encontraron unidades</div>
                        ) : (
                            filteredUnits.map(unit => (
                                <div
                                    key={unit.id}
                                    onClick={() => setSelectedUnit(unit)}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors border ${selectedUnit?.id === unit.id
                                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                        : isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className="font-bold text-lg">
                                        {unit.block ? `Bloque ${unit.block} - ` : ''} Apto {unit.number}
                                    </div>
                                    <div className={`text-sm ${selectedUnit?.id === unit.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {unit.residents?.[0]?.full_name || 'Sin residente principal'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Center: Actions */}
                <div className="col-span-5 flex flex-col justify-start gap-6 pt-4">
                    {!selectedUnit ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <Search size={64} className="mb-4 text-slate-400" />
                            <p className="text-xl font-medium">Seleccione una unidad para comenzar</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
                                <h2 className="text-xl font-bold mb-1">{selectedUnit.block ? `Torre ${selectedUnit.block} - ` : ''} {selectedUnit.number}</h2>
                                <p className="text-slate-500">Seleccione el tipo de notificación a enviar:</p>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <button
                                        onClick={() => handleNotify('Paquete Recibido')}
                                        disabled={loading}
                                        className="col-span-2 p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-2 group"
                                    >
                                        <Package size={40} className="group-hover:rotate-12 transition-transform" />
                                        <span className="text-lg font-bold">Llegó Paquete / Encomienda</span>
                                    </button>

                                    <button
                                        onClick={() => handleNotify('Recibo de Agua')}
                                        disabled={loading}
                                        className={`p-4 rounded-xl border-2 hover:scale-105 transition-all flex flex-col items-center gap-2 ${isDark ? 'border-cyan-800 hover:bg-cyan-900/30' : 'border-cyan-100 hover:bg-cyan-50'}`}
                                    >
                                        <Droplets className="text-cyan-500" size={32} />
                                        <span className="font-medium">Recibo Agua</span>
                                    </button>

                                    <button
                                        onClick={() => handleNotify('Recibo de Luz')}
                                        disabled={loading}
                                        className={`p-4 rounded-xl border-2 hover:scale-105 transition-all flex flex-col items-center gap-2 ${isDark ? 'border-yellow-800 hover:bg-yellow-900/30' : 'border-yellow-100 hover:bg-yellow-50'}`}
                                    >
                                        <Zap className="text-yellow-500" size={32} />
                                        <span className="font-medium">Recibo Luz</span>
                                    </button>

                                    <button
                                        onClick={() => handleNotify('Recibo de Gas')}
                                        disabled={loading}
                                        className={`p-4 rounded-xl border-2 hover:scale-105 transition-all flex flex-col items-center gap-2 ${isDark ? 'border-orange-800 hover:bg-orange-900/30' : 'border-orange-100 hover:bg-orange-50'}`}
                                    >
                                        <Flame className="text-orange-500" size={32} />
                                        <span className="font-medium">Recibo Gas</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: History Log */}
                <div className="col-span-3">
                    <div className={`h-full rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col overflow-hidden`}>
                        <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'} flex justify-between items-center`}>
                            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide text-slate-500">
                                <History size={16} />
                                Actividad Reciente
                            </h3>
                            {/* Block Filter */}
                            <select
                                className={`text-xs p-1 rounded border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Filter logic (mock for now because logs are local state)
                                    // In a real app, this would filter 'logs'
                                    // For now just console log
                                    console.log('Filter by:', val);
                                }}
                            >
                                <option value="">Todos los Bloques</option>
                                {[...new Set(units.map(u => u.block).filter(Boolean))].map(b => (
                                    <option key={b} value={b}>Torre {b}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {logs.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center mt-10 italic">No hay notificaciones recientes</p>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className={`relative pl-4 pb-4 border-l-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900"></div>
                                        <div className="text-xs text-slate-400 mb-1">{log.timestamp.toLocaleTimeString()}</div>
                                        <div className="font-bold text-sm">{log.type}</div>
                                        <div className="text-xs text-slate-500">Unidad: {log.unit}</div>
                                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                            <CheckCircle size={10} /> Enviado
                                        </div>
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
