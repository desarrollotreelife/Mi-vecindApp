import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Clock, User, BookOpen, AlertTriangle, List, Plus } from 'lucide-react';

interface LogEntry {
    id: string;
    guardName: string;
    timestamp: string;
    content: string;
}

export const LogbookPage = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [content, setContent] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Load from local storage for demo purposes
    useEffect(() => {
        const saved = localStorage.getItem('logbook_entries');
        if (saved) {
            setEntries(JSON.parse(saved));
        }
    }, []);

    const handleSave = () => {
        if (!content.trim()) return;

        const newEntry: LogEntry = {
            id: Date.now().toString(),
            guardName: user?.name || 'Guardia Desconocido',
            timestamp: new Date().toISOString(),
            content: content
        };

        const updatedEntries = [newEntry, ...entries];
        setEntries(updatedEntries);
        localStorage.setItem('logbook_entries', JSON.stringify(updatedEntries));
        setContent(''); // Clear form
    };

    // Role check
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
    const hasAccess = ['guard', 'vigilante', 'admin', 'celador'].includes(roleName.toLowerCase());

    if (!hasAccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <AlertTriangle size={48} className="mb-4 text-amber-500" />
                <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
                <p>Esta sección es exclusiva para personal de seguridad.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <BookOpen className="text-blue-600" />
                        Bitácora Digital de Seguridad
                    </h1>
                    <p className="text-slate-500 mt-1">Registro oficial de novedades y control de puestos</p>
                </div>
                <div className="text-right hidden md:block bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-xl font-mono text-blue-700 font-bold">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Entry Form - Professional Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                        <div className="bg-slate-50 border-b border-slate-200 p-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Plus size={18} className="text-blue-500" />
                                Nueva Anotación
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Oficial de Guardia</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                                    <User size={16} className="text-slate-400" />
                                    <span className="font-medium text-sm truncate">{user?.name || user?.full_name || 'Guardia de Turno'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalle del Evento</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-40"
                                    placeholder="Describa la novedad, incidente o reporte de turno..."
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!content.trim()}
                                className="w-full bg-blue-600 text-white rounded-lg py-2.5 px-4 font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Save size={16} />
                                REGISTRAR NOVEDAD
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log Table - Corporate Style */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <List size={18} className="text-slate-400" />
                                Historial de Eventos
                            </h3>
                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                {entries.length} Registros
                            </span>
                        </div>

                        {entries.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <BookOpen size={24} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Sin novedades registradas</p>
                                <p className="text-xs text-slate-400 mt-1">El historial de hoy está limpio.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 w-48">Hora / Fecha</th>
                                            <th className="px-6 py-3 w-48">Oficial</th>
                                            <th className="px-6 py-3">Descripción del Evento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 font-mono">
                                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(entry.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                                            {(entry.guardName || 'G').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-slate-700">{entry.guardName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                        {entry.content}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
