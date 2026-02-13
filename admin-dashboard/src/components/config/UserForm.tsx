import React, { useState, useEffect } from 'react';
import { X, Camera, User } from 'lucide-react';
import { WebcamCapture } from '../common/WebcamCapture';
import api from '../../services/api';

interface UserFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || '',
        email: initialData?.email || '',
        document_num: initialData?.document_num || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        role_id: initialData?.role_id || '4', // Default to Guard (4)
        position: initialData?.position || '',
        shift: initialData?.shift || '',
        security_company: initialData?.security_company || '',
        status: initialData?.status || 'active',
        password: '', // Only for creation or reset
        photo: initialData?.profile_photo || null
    });

    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shifts, setShifts] = useState<any[]>([]);

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await api.get('/config/shifts');
                setShifts(res.data);
            } catch (err) {
                console.error('Error loading shifts', err);
            }
        };
        fetchShifts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            console.error('Error saving user:', err);
            let errorMsg = err.response?.data?.error || err.message || 'Error al guardar usuario';

            // Traducir errores técnicos de base de datos
            if (typeof errorMsg === 'string') {
                if (errorMsg.includes('Unique constraint failed')) {
                    if (errorMsg.includes('document_num')) {
                        errorMsg = 'Error: Este número de documento/cédula ya está registrado por otro usuario.';
                    } else if (errorMsg.includes('email')) {
                        errorMsg = 'Error: Este nombre de usuario ya está ocupado. Intente con otro.';
                    } else {
                        errorMsg = 'Error: Datos duplicados en el sistema.';
                    }
                }
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Foto */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        {formData.photo ? (
                            <div className="relative">
                                <img
                                    src={formData.photo.startsWith('data:') ? formData.photo : `http://localhost:3001${formData.photo}`}
                                    alt="Profile"
                                    className="h-32 w-32 object-cover rounded-full border-4 border-white shadow-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, photo: null })}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                                    <User size={40} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Camera size={16} /> Tomar Foto
                                </button>
                            </div>
                        )}

                        {showCamera && (
                            <WebcamCapture
                                onCapture={(img) => {
                                    setFormData({ ...formData, photo: img });
                                    setShowCamera(false);
                                }}
                                onClose={() => setShowCamera(false)}
                            />
                        )}
                    </div>

                    {/* Campos Básicos */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nombre Completo *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Cédula / Documento *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.document_num}
                            onChange={e => setFormData({ ...formData, document_num: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Usuario del Sistema *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Nombre de usuario único"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Contraseña {initialData ? '(Opcional)' : '*'}</label>
                        <input
                            type="password"
                            required={!initialData}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder={initialData ? "Dejar en blanco para mantener actual" : "Mínimo 6 caracteres"}
                        />
                        {initialData && <p className="text-xs text-slate-400">Ingrese una nueva contraseña solo si desea cambiarla.</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Teléfono</label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Dirección</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Configuración Laboral</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Rol del Sistema *</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.role_id}
                            onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                        >
                            <option value="2">Administrador</option>
                            <option value="4">Guardia de Seguridad</option>
                            {/* Role 1 usually reserved for master/superadmin */}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Cargo</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                            placeholder="Ej. Jefe de Seguridad"
                        />
                    </div>

                    {formData.role_id === '4' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Turno</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.shift}
                                onChange={e => setFormData({ ...formData, shift: e.target.value })}
                            >
                                <option value="">Seleccione un turno</option>
                                {shifts.map(shift => (
                                    <option key={shift.id} value={shift.name}>
                                        {shift.name} ({shift.start_time} - {shift.end_time})
                                    </option>
                                ))}
                                {shifts.length === 0 && (
                                    <option disabled>
                                        -- No hay turnos creados (o reinicie servidor) --
                                    </option>
                                )}
                            </select>
                        </div>
                    )}

                    {formData.role_id === '4' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Empresa de Seguridad</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.security_company}
                                onChange={e => setFormData({ ...formData, security_company: e.target.value })}
                                placeholder="Ej. Seguridad Privada LTDA"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Estado</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>


                </div>
            </div>

            {
                error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                        {error}
                    </div>
                )
            }

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar Usuario' : 'Crear Usuario')}
                </button>
            </div>
        </form >
    );
};
