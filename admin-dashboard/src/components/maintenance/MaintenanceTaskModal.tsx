import React, { useState, useEffect } from 'react';
import { X, Calendar, Wrench } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MaintenanceTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    items: any[];
    providers: any[];
}

export const MaintenanceTaskModal: React.FC<MaintenanceTaskModalProps> = ({ isOpen, onClose, onSuccess, items, providers }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'preventive',
        priority: 'medium',
        item_id: '',
        provider_id: '',
        scheduled_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                type: 'preventive',
                priority: 'medium',
                item_id: items[0]?.id?.toString() || '',
                provider_id: '',
                scheduled_date: new Date().toISOString().split('T')[0]
            });
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/maintenance/tasks', formData);
            toast.success('Tarea programada exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error al programar tarea');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Wrench size={20} className="text-primary-600" />
                        <h2 className="text-lg font-bold">Programar Tarea</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Título de la Tarea</label>
                        <input
                            className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="Ej: Revisión Mensual de Ascensor"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Activo / Infraestructura</label>
                        <select
                            className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.item_id}
                            onChange={e => setFormData({ ...formData, item_id: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar activo...</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                            <select
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="preventive">Preventivo</option>
                                <option value="corrective">Correctivo</option>
                                <option value="inspection">Inspección</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Prioridad</label>
                            <select
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta / Urgente</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Proveedor (Opcional)</label>
                        <select
                            className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.provider_id}
                            onChange={e => setFormData({ ...formData, provider_id: e.target.value })}
                        >
                            <option value="">Sin asignar / Personal interno</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Fecha Programada</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 mt-1 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.scheduled_date}
                                onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                        <Button icon={Wrench} isLoading={isLoading} type="submit">Crear Tarea</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
