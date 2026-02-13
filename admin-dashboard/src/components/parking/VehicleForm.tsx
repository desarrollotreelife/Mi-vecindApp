import React, { useState, useEffect } from 'react';
import { X, Save, Car, PaintBucket, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { ResidentSelect } from '../common/ResidentSelect';

interface VehicleFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CAR_BRANDS = [
    'Mazda', 'Chevrolet', 'Renault', 'Toyota', 'Kia', 'Nissan', 'Hyundai',
    'Ford', 'Volkswagen', 'Suzuki', 'BMW', 'Mercedes-Benz', 'Audi', 'Honda', 'Otro'
].sort();

const MOTO_BRANDS = [
    'Yamaha', 'Bajaj', 'AKT', 'Honda', 'Suzuki', 'Victory', 'TVS',
    'Hero', 'Kawasaki', 'KTM', 'Royal Enfield', 'Benelli', 'Otro'
].sort();

export const VehicleForm: React.FC<VehicleFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [residents, setResidents] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        plate: '',
        type: 'car', // 'car' | 'suv' | 'motorcycle'
        brand: '',
        color: '',
        resident_id: ''
    });

    const [customBrand, setCustomBrand] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchResidents();
        }
    }, [isOpen]);

    const fetchResidents = async () => {
        try {
            const res = await api.get('/residents');
            setResidents(res.data);
        } catch (error) {
            console.error('Error fetching residents:', error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'brand' && value === 'Otro') {
            setCustomBrand(true);
            setFormData({ ...formData, brand: '' });
        } else if (name === 'type') {
            // Reset brand when type changes to avoid invalid combinations
            setFormData({ ...formData, type: value, brand: '' });
            setCustomBrand(false);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/parking/vehicles', {
                ...formData,
                resident_id: Number(formData.resident_id)
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error registering vehicle:', error);
            alert('Error al registrar vehículo.');
        } finally {
            setIsLoading(false);
        }
    };

    const getBrandList = () => {
        return formData.type === 'motorcycle' ? MOTO_BRANDS : CAR_BRANDS;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Car className="text-primary-600" size={20} />
                        Registrar Vehículo
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Residente Propietario</label>
                            <ResidentSelect
                                residents={residents}
                                value={formData.resident_id}
                                onChange={(val) => setFormData({ ...formData, resident_id: val })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="plate"
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all uppercase"
                                        placeholder="ABC-123"
                                        value={formData.plate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    name="type"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="car">Carro</option>
                                    <option value="suv">Camioneta</option>
                                    <option value="motorcycle">Moto</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                                {customBrand ? (
                                    <input
                                        type="text"
                                        name="brand"
                                        autoFocus
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Especifique marca..."
                                        value={formData.brand}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <select
                                        name="brand"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                                        value={formData.brand}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccione marca...</option>
                                        {getBrandList().map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <div className="relative">
                                    <PaintBucket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="color"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Rojo"
                                        value={formData.color}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                        <Button icon={Save} isLoading={isLoading} type="submit">Registrar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
