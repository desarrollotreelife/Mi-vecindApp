import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Car, User, Trash2, Share2, X, Settings2, Camera } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export const ResidentVisitsPage: React.FC = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
    const [configData, setConfigData] = useState({
        is_permanent: false,
        allowed_days: '',
        allowed_time_start: '',
        allowed_time_end: ''
    });

    const [newVisit, setNewVisit] = useState({
        name: '',
        document_num: '',
        vehicle_plate: '',
        date: '',
        time: ''
    });

    const fetchVisits = async () => {
        try {
            // Assuming resident_id is inferred from token or user object
            const res = await api.get(`/visits?resident_id=${user?.resident?.id || ''}`);
            setVisits(res.data);
        } catch (error) {
            console.error('Error fetching visits', error);
            // toast.error('Error al cargar visitas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchVisits();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const scheduledEntry = new Date(`${newVisit.date}T${newVisit.time}`);

            await api.post('/visits', {
                resident_id: user?.resident?.id, // Ensure backend handles this if not passed
                visitor_name: newVisit.name,
                document_num: newVisit.document_num,
                vehicle_plate: newVisit.vehicle_plate,
                scheduled_date: scheduledEntry.toISOString(),
                status: 'pending'
            });

            toast.success('Visita programada exitosamente');
            setIsFormOpen(false);
            setNewVisit({ name: '', document_num: '', vehicle_plate: '', date: '', time: '' });
            fetchVisits();
        } catch (error) {
            console.error(error);
            toast.error('Error al programar visita');
        }
    };

    const shareOnWhatsApp = (visit: any) => {
        const message = `Hola ${visit.visitor.name}, te he autorizado el ingreso al conjunto. 
Fecha: ${new Date(visit.scheduled_entry).toLocaleString()}
Dirección: ${user?.resident?.unit ? `Apto ${user.resident.unit.number}` : 'Copropiedad'}

*Muestra este código QR en portería:*`;
        // In a real app, we would upload the QR image or send a link to a "Virtual Pass" page.
        // For now, we just send the text.
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const openConfig = (visit: any) => {
        setSelectedVisitor(visit.visitor);
        setConfigData({
            is_permanent: visit.visitor.is_permanent || false,
            allowed_days: visit.visitor.allowed_days || '',
            allowed_time_start: visit.visitor.allowed_time_start || '',
            allowed_time_end: visit.visitor.allowed_time_end || ''
        });
        setIsConfigOpen(true);
    };

    const handleConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/visitors/${selectedVisitor.id}/permanent`, configData);
            toast.success('Configuración de visitante guardada (Biometría activada)');
            setIsConfigOpen(false);
            fetchVisits();
        } catch (error) {
            console.error(error);
            toast.error('Error guardando configuración');
        }
    };

    return (
        <div className="space-y-6 pb-20"> {/* Padding bottom for mobile nav overlap */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Mis Visitas</h1>
                    <p className="text-sm text-slate-500">Gestiona el acceso de tus invitados</p>
                </div>
                <Button size="sm" icon={Plus} onClick={() => setIsFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    Nueva
                </Button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Programar Ingreso</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Visitante</label>
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={newVisit.name}
                                    onChange={e => setNewVisit({ ...newVisit, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Documento</label>
                                <input
                                    type="text"
                                    placeholder="Cédula / DNI"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={newVisit.document_num}
                                    onChange={e => setNewVisit({ ...newVisit, document_num: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={newVisit.date}
                                        onChange={e => setNewVisit({ ...newVisit, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Hora</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={newVisit.time}
                                        onChange={e => setNewVisit({ ...newVisit, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Vehículo (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Placa del vehículo"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                                    value={newVisit.vehicle_plate}
                                    onChange={e => setNewVisit({ ...newVisit, vehicle_plate: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-lg shadow-emerald-200">
                                Confirmar Visita
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {isConfigOpen && selectedVisitor && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-slate-800">Acceso Permanente</h3>
                            <button onClick={() => setIsConfigOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-800">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <User size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900">{selectedVisitor.name}</h4>
                                <p className="text-xs text-indigo-500">CC: {selectedVisitor.document_num}</p>
                            </div>
                        </div>

                        <form onSubmit={handleConfigSubmit} className="space-y-5">
                            <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={configData.is_permanent}
                                    onChange={e => setConfigData({ ...configData, is_permanent: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600"
                                />
                                <div>
                                    <span className="font-bold text-slate-800 block">Autorizar entrada autónoma</span>
                                    <span className="text-xs text-slate-500">Permite registrar biometría facial</span>
                                </div>
                            </label>

                            {configData.is_permanent && (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <div className="p-4 border border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                                            <Camera size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-indigo-900">Registrar Rostro (Biometría)</span>
                                        <span className="text-xs text-indigo-500 mt-1">El visitante no necesitará anunciarse en portería.</span>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Días Permitidos</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Lun, Mar, Jue"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={configData.allowed_days}
                                            onChange={e => setConfigData({ ...configData, allowed_days: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Hora Inicio</label>
                                            <input
                                                type="time"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                                value={configData.allowed_time_start}
                                                onChange={e => setConfigData({ ...configData, allowed_time_start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Hora Fin</label>
                                            <input
                                                type="time"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                                value={configData.allowed_time_end}
                                                onChange={e => setConfigData({ ...configData, allowed_time_end: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg shadow-lg shadow-indigo-200 mt-2">
                                Guardar Preferencias
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Cargando visitas...</div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <User size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500">No tienes visitas programadas.</p>
                        <Button variant="ghost" className="mt-2 text-emerald-600" onClick={() => setIsFormOpen(true)}>
                            Crear mi primera visita
                        </Button>
                    </div>
                ) : (
                    visits.map(visit => (
                        <div key={visit.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                                        {visit.qr_token && (visit.status === 'pending' || visit.status === 'active') ? (
                                            <QRCodeSVG value={visit.qr_token} size={56} />
                                        ) : (
                                            <User size={24} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{visit.visitor.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>{new Date(visit.scheduled_entry).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{new Date(visit.scheduled_entry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        {visit.vehicle_plate && (
                                            <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs font-mono text-slate-600 mt-2">
                                                <Car size={12} /> {visit.vehicle_plate}
                                            </div>
                                        )}
                                        {visit.visitor.is_permanent && (
                                            <span className="block mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-flex">
                                                Visitante Permanente
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${visit.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    visit.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    {visit.status === 'pending' ? 'Pendiente' :
                                        visit.status === 'active' ? 'En el conjunto' : 'Finalizada'}
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex gap-3">
                                {visit.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => shareOnWhatsApp(visit)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                                        >
                                            <Share2 size={16} />
                                            Enviar Pase
                                        </button>
                                        <button
                                            onClick={() => openConfig(visit)}
                                            className="px-3 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            title="Configurar Acceso Permanente"
                                        >
                                            <Settings2 size={16} />
                                        </button>
                                        <button className="w-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
