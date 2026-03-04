import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Home, CreditCard, Camera, Trash2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { FaceEnrollment } from './FaceEnrollment';

interface ResidentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export const ResidentForm: React.FC<ResidentFormProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [unitsStructure, setUnitsStructure] = useState<Record<string, any[]>>({});
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        document_num: '',
        unit_id: '',
        unit_number: '',
        user_type: 'resident',
        photo: '', // Base64 string
        biometric_descriptor: '',
        password: '',
        coefficient: ''
    });

    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const response = await api.get('/units/structure');
                setUnitsStructure(response.data);
            } catch (error) {
                console.error('Error fetching units structure:', error);
            }
        };
        if (isOpen) {
            fetchStructure();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                document_num: initialData.document_num || '',
                unit_id: initialData.unit_id || '',
                unit_number: initialData.unit_number || '',
                user_type: initialData.role === 'admin' ? 'admin' : initialData.role === 'guard' ? 'guard' : 'resident',
                photo: initialData.profile_photo || '',
                biometric_descriptor: initialData.biometric_descriptor || '',
                password: '',
                coefficient: initialData.coefficient || ''
            });
        } else {
            setFormData({
                full_name: '',
                email: '',
                phone: '',
                document_num: '',
                unit_id: '',
                unit_number: '',
                user_type: 'resident',
                photo: '',
                biometric_descriptor: '',
                password: '',
                coefficient: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resizeImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const submitData = {
                ...formData,
                type: ['resident', 'propietario', 'residente_propietario'].includes(formData.user_type)
                    ? formData.user_type
                    : 'resident'
            };

            // Final check on image size/compression before sending could be here, 
            // but we'll do it on capture to show immediate preview of optimized image.
            if (initialData?.id) {
                await api.put(`/residents/${initialData.id}`, submitData);
            } else {
                await api.post('/residents', submitData);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving resident:', error);
            const msg = error.response?.data?.error || error.message || 'Error desconocido';
            alert(`Error al guardar residente: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <User className="text-primary-600" size={20} />
                        Nuevo Residente
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej. Ana María Polo"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="ejemplo@email.com (Opcional)"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario de Sistema (Auto-generado)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                    value={formData.document_num}
                                    placeholder="Se usará la cédula como usuario"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Este será el usuario para que el residente inicie sesión (Copia del número de documento).</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="+57 300..."
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Inicial</label>
                                <input
                                    type="text"
                                    name="password"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder={initialData ? "Dejar vacío = actual" : "Defecto: 123456"}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula (Obligatorio)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="document_num"
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="123456789"
                                    value={formData.document_num}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Photo Section */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fotografía (Biometría)</label>
                            <div className="flex items-center gap-4">
                                {formData.photo ? (
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500">
                                        <img src={getImageUrl(formData.photo)} alt="Resident" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, photo: '' })}
                                            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                                        <User size={32} />
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    icon={Camera}
                                    onClick={() => setShowCamera(true)}
                                >
                                    {formData.photo ? 'Cambiar Foto' : 'Tomar Foto'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad/Apto</label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    name="unit_id"
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                    value={formData.unit_id}
                                    onChange={(e) => {
                                        const unitId = e.target.value;
                                        // Find the unit number for display/legacy purposes
                                        let unitNumber = '';
                                        Object.values(unitsStructure).forEach(units => {
                                            const found = units.find(u => u.id.toString() === unitId);
                                            if (found) unitNumber = found.block ? `${found.block} - ${found.number}` : found.number;
                                        });
                                        setFormData({ ...formData, unit_id: unitId, unit_number: unitNumber });
                                    }}
                                >
                                    <option value="">Seleccionar Unidad...</option>
                                    {Object.entries(unitsStructure as Record<string, any[]>).map(([block, units]) => (
                                        <optgroup key={block} label={block}>
                                            {units.map((unit: any) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.number}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Coeficiente de Copropiedad</label>
                            <input
                                type="number"
                                name="coefficient"
                                step="0.0001"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Ej. 0.0150"
                                value={(formData as any).coefficient || ''}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-slate-400 mt-1">Requerido por Ley 675 para el cálculo de expensas y votos.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Usuario</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    name="user_type"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                    value={formData.user_type}
                                    onChange={handleChange}
                                >
                                    <option value="resident">Residente en Alquiler</option>
                                    <option value="propietario">Propietario</option>
                                    <option value="residente_propietario">Residente Propietario</option>
                                    <option value="admin">Administrador</option>
                                    <option value="guard">Guarda de Seguridad</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 shrink-0">
                        <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                        <Button icon={Save} isLoading={isLoading} type="submit">Guardar Residente</Button>
                    </div>
                </form>
            </div >

            {showCamera && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                    <FaceEnrollment
                        onCapture={async (descriptor, imageSrc) => {
                            const optimizedImage = await resizeImage(imageSrc);
                            setFormData({
                                ...formData,
                                photo: optimizedImage,
                                biometric_descriptor: JSON.stringify(Array.from(descriptor))
                            } as any);
                            setShowCamera(false);
                        }}
                        onCancel={() => setShowCamera(false)}
                    />
                </div>
            )}
        </div >
    );
};
