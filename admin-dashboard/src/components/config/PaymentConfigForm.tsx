import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import api from '../../services/api';

export const PaymentConfigForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        payment_provider: 'epayco',
        epayco_public_key: '',
        epayco_private_key: '',
        epayco_p_cust_id: '',
        epayco_p_key: '',
        is_payment_active: false,
        billing_day: 1,
        base_admin_fee: 0
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get('/config/payment-config');
            if (res.data) {
                setFormData(prev => ({
                    ...prev,
                    ...res.data,
                    epayco_private_key: '', // Don't show existing private key for security
                    base_admin_fee: Number(res.data.base_admin_fee) || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching payment config:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/config/payment-config', formData);
            setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
            // Clear private key field after save
            setFormData(prev => ({ ...prev, epayco_private_key: '' }));
        } catch (error) {
            console.error('Error updating payment config:', error);
            setMessage({ type: 'error', text: 'Error al guardar. Verifique los datos.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Configuración de Pasarela de Pagos</h2>
                    <p className="text-sm text-slate-500">Gestiona las credenciales de ePayco para recibir pagos en línea.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {/* Status Toggle */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-blue-900">Estado de Pagos en Línea</h3>
                        <p className="text-sm text-blue-700">Activa o desactiva la opción de pagar facturas a través de la plataforma.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_payment_active"
                            checked={formData.is_payment_active}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-900 border-b pb-2">Credenciales de Integración (P_KEY)</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">P_CUST_ID_CLIENTE</label>
                            <input
                                type="text"
                                name="epayco_p_cust_id"
                                value={formData.epayco_p_cust_id || ''}
                                onChange={handleChange}
                                placeholder="Ej: 12345"
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">ID de cliente de ePayco.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">P_KEY (Clave de Integración)</label>
                            <input
                                type="password"
                                name="epayco_p_key"
                                value={formData.epayco_p_key || ''}
                                onChange={handleChange}
                                placeholder="Ej: a1b2c3d4e5..."
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-900 border-b pb-2">Llaves de API (Public/Private)</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
                            <input
                                type="text"
                                name="epayco_public_key"
                                value={formData.epayco_public_key || ''}
                                onChange={handleChange}
                                placeholder="Ej: 491d6a0b..."
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Llave pública para el checkout.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Private Key</label>
                            <input
                                type="password"
                                name="epayco_private_key"
                                value={formData.epayco_private_key || ''}
                                onChange={handleChange}
                                placeholder="Dejar en blanco para no cambiar"
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-slate-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Solo ingrésalo si deseas actualizarlo.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-900 border-b pb-2">Automatización de Facturación</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monto Base de Administración (Total Conjunto)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    name="base_admin_fee"
                                    value={formData.base_admin_fee}
                                    onChange={handleChange}
                                    className="w-full pl-8 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Ej: 50000000"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Este valor se multiplicará por el coeficiente de cada unidad.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Día de Facturación Mensual</label>
                            <input
                                type="number"
                                name="billing_day"
                                min="1"
                                max="28"
                                value={formData.billing_day}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Día del mes en que se generarán automáticamente las cuentas de cobro.</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Guardar Configuración
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
