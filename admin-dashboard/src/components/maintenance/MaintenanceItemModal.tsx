import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MaintenanceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export const MaintenanceItemModal: React.FC<MaintenanceItemModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Elevadores',
        brand: '',
        model: '',
        serial_number: '',
        purchase_date: '',
        warranty_until: '',
        status: 'operational',
        location: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                purchase_date: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split('T')[0] : '',
                warranty_until: initialData.warranty_until ? new Date(initialData.warranty_until).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                name: '',
                category: 'Elevadores',
                brand: '',
                model: '',
                serial_number: '',
                purchase_date: '',
                warranty_until: '',
                status: 'operational',
                location: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (initialData?.id) {
                await api.put(`/maintenance/items/${initialData.id}`, formData);
                toast.success('Activo actualizado');
            } else {
                await api.post('/maintenance/items', formData);
                toast.success('Activo registrado');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error al guardar activo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Package size={20} className="text-primary-600" />
                        <h2 className="text-lg font-bold">{initialData ? 'Editar Activo' : 'Nuevo Activo'}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Activo</label>
                            <input
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Ej: Ascensor Torre A"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
                            <select
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Elevadores</option>
                                <option>Motobombas</option>
                                <option>Seguridad</option>
                                <option>Zonas Verdes</option>
                                <option>Eléctricos</option>
                                <option>Piscina</option>
                                <option>Otros</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                            <select
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="operational">Operativo</option>
                                <option value="maintenance">En Mantenimiento</option>
                                <option value="broken">Fuera de Servicio</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Marca</label>
                            <input
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Ej: Otis"
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Ubicación</label>
                            <input
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Ej: Hall Principal"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Fecha Compra</label>
                            <input
                                type="date"
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.purchase_date}
                                onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Venc. Garantía</label>
                            <input
                                type="date"
                                className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.warranty_until}
                                onChange={e => setFormData({ ...formData, warranty_until: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                        <Button icon={Save} isLoading={isLoading} type="submit">Guardar Activo</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
