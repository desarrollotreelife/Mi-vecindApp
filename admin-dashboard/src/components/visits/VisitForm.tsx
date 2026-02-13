import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar as CalendarIcon, Car, Camera, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { WebcamCapture } from '../common/WebcamCapture';
import { ResidentSelect } from '../common/ResidentSelect';

interface VisitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const VisitForm: React.FC<VisitFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [residents, setResidents] = useState<any[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [isImmediate, setIsImmediate] = useState(true);
    const [formData, setFormData] = useState({
        visitor_name: '',
        visitor_doc: '',
        resident_id: '',
        vehicle_plate: '',
        scheduled_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        photo: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchResidents();
            setIsImmediate(true); // Reset to immediate on open
            setFormData(prev => ({ ...prev, scheduled_date: new Date().toISOString().slice(0, 16) }));
        }
    }, [isOpen]);

    const fetchResidents = async () => {
        try {
            const res = await api.get('/residents');
            setResidents(res.data);
        } catch (error) {
            console.error('Error fetching residents for dropdown:', error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                visitor_name: formData.visitor_name,
                document_num: formData.visitor_doc,
                resident_id: Number(formData.resident_id),
                vehicle_plate: formData.vehicle_plate || undefined,
                scheduled_date: isImmediate ? new Date().toISOString() : new Date(formData.scheduled_date).toISOString(),
                photo: formData.photo,
                status: isImmediate ? 'active' : 'pending'
            };

            await api.post('/visits', payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error scheduling visit:', error);
            alert('Error al registrar ingreso.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="text-primary-600" size={20} />
                        Ingreso de Visitante
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
                                <input
                                    type="text"
                                    name="visitor_doc"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="12345..."
                                    value={formData.visitor_doc}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Visitante</label>
                                <input
                                    type="text"
                                    name="visitor_name"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Nombre..."
                                    value={formData.visitor_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Photo Section */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fotografía del Visitante</label>
                            <div className="flex items-center gap-4">
                                {formData.photo ? (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500">
                                        <img src={formData.photo} alt="Visitor" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, photo: '' })}
                                            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                                        <User size={24} />
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    icon={Camera}
                                    onClick={() => setShowCamera(true)}
                                >
                                    {formData.photo ? 'Cambiar Foto' : 'Tomar Foto'}
                                </Button>
                            </div>
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Residente a Visitar</label>
                            <ResidentSelect
                                residents={residents}
                                value={formData.resident_id}
                                onChange={(val) => setFormData({ ...formData, resident_id: val })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Fecha/Hora</label>
                                    <label className="flex items-center gap-2 text-xs text-blue-600 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isImmediate}
                                            onChange={(e) => setIsImmediate(e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                                        />
                                        Ingreso Inmediato
                                    </label>
                                </div>
                                <input
                                    type="datetime-local"
                                    name="scheduled_date"
                                    required={!isImmediate}
                                    disabled={isImmediate}
                                    className={`w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${isImmediate ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                    value={formData.scheduled_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Placa (Opcional)</label>
                                <div className="relative">
                                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="vehicle_plate"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all uppercase"
                                        placeholder="ABC-123"
                                        value={formData.vehicle_plate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 shrink-0">
                        <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                        <Button icon={Save} isLoading={isLoading} type="submit">Registrar</Button>
                    </div>
                </form>
            </div>

            {showCamera && (
                <WebcamCapture
                    onCapture={(imgSrc) => setFormData({
                        ...formData,
                        photo: imgSrc,
                        scheduled_date: new Date().toISOString().slice(0, 16)
                    })}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};
