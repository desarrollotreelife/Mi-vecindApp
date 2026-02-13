import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { ResidentSelect } from '../common/ResidentSelect';

interface BookingFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amenityId?: number; // Pre-selected amenity
}

export const BookingForm: React.FC<BookingFormProps> = ({ isOpen, onClose, onSuccess, amenityId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [residents, setResidents] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amenity_id: amenityId || '',
        resident_id: '',
        start_time: '',
        end_time: '',
        date: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (amenityId) {
                setFormData(prev => ({ ...prev, amenity_id: amenityId }));
            }
        }
    }, [isOpen, amenityId]);

    const fetchData = async () => {
        try {
            const [amenitiesRes, residentsRes] = await Promise.all([
                api.get('/amenities'),
                api.get('/residents')
            ]);
            setAmenities(amenitiesRes.data);
            setResidents(residentsRes.data);
        } catch (error) {
            console.error('Error fetching data for booking:', error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Construct ISO DateTime strings
        const startDateTime = new Date(`${formData.date}T${formData.start_time}`).toISOString();
        const endDateTime = new Date(`${formData.date}T${formData.end_time}`).toISOString();

        try {
            await api.post('/amenities/book', {
                amenity_id: Number(formData.amenity_id),
                resident_id: Number(formData.resident_id),
                start_time: startDateTime,
                end_time: endDateTime,
                status: 'confirmed'
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating booking:', error);
            alert(error.response?.data?.error || 'Error al crear la reserva.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-primary-600" size={20} />
                        Nueva Reserva
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amenidad / Zona</label>
                            <select
                                name="amenity_id"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                                value={formData.amenity_id}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione zona...</option>
                                {amenities.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Residente</label>
                            <ResidentSelect
                                residents={residents}
                                value={formData.resident_id}
                                onChange={(val) => setFormData({ ...formData, resident_id: val })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                name="date"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hora Inicio</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="time"
                                        name="start_time"
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.start_time}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hora Fin</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="time"
                                        name="end_time"
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.end_time}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                        <Button icon={Save} isLoading={isLoading} type="submit">Reservar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
