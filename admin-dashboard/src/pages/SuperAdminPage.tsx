import React, { useState, useEffect } from 'react';
import { Building2, Plus, Power, Trash2, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export const SuperAdminPage: React.FC = () => {
    const [complexes, setComplexes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create Complex Modal
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newComplex, setNewComplex] = useState({
        name: '', nit: '', address: '', city: '',
        admin_email: '', admin_password: '', plan_type: 'standard'
    });

    // Payment Modal
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedComplex, setSelectedComplex] = useState<any>(null);
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'transfer', reference: '' });

    const fetchComplexes = async () => {
        try {
            const response = await api.get('/super-admin/complexes');
            setComplexes(response.data);
        } catch (error) {
            console.error('Error fetching complexes:', error);
            // toast.error('Error al cargar lista');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/super-admin/complexes', newComplex);
            setIsFormOpen(false);
            setNewComplex({ name: '', nit: '', address: '', city: '', admin_email: '', admin_password: '', plan_type: 'standard' });
            fetchComplexes();
            toast.success('Conjunto creado exitosamente');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al crear');
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean, complexName: string) => {
        if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'DESACTIVAR' : 'ACTIVAR'} el conjunto "${complexName}"?`)) return;

        try {
            await api.patch(`/super-admin/complexes/${id}/status`, { is_active: !currentStatus });
            toast.success(`Conjunto ${!currentStatus ? 'activado' : 'desactivado'}`);
            fetchComplexes();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplex) return;
        try {
            // New endpoint for subscription update / payment
            await api.patch(`/super-admin/complexes/${selectedComplex.id}/subscription`, {
                status: 'active',
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // +30 days logic should be in backend ideally, but for now passing from client or letting backend handle if param omitted
                plan: selectedComplex.plan_type
            });
            // Also call payment record if exists, but we unified logic in updateSubscription for now in plan

            setIsPaymentOpen(false);
            setPaymentData({ amount: 0, method: 'transfer', reference: '' });
            fetchComplexes();
            toast.success('Suscripción extendida exitosamente');
        } catch (error: any) {
            toast.error('Error al registrar pago');
        }
    };

    const openPaymentModal = (complex: any) => {
        setSelectedComplex(complex);
        setIsPaymentOpen(true);
    };

    const filteredComplexes = complexes.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.nit?.includes(search)
    );

    if (loading) return <div className="flex h-96 items-center justify-center text-slate-400">Cargando...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Clientes (SaaS)</h1>
                    <p className="text-slate-500 mt-1">Gestiona suscripciones, facturación y estados de servicio.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button icon={Plus} onClick={() => setIsFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                            <th className="px-6 py-4">Cliente / Conjunto</th>
                            <th className="px-6 py-4">Suscripción</th>
                            <th className="px-6 py-4">Próximo Cobro</th>
                            <th className="px-6 py-4">Estado Servicio</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredComplexes.map(complex => {
                            const isPastDue = complex.billing_due_date && new Date(complex.billing_due_date) < new Date();
                            return (
                                <tr key={complex.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{complex.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{complex.nit || 'NIT Pendiente'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-700 capitalize">{complex.plan_type || 'Standard'}</div>
                                        <div className={`text-xs mt-0.5 ${complex.subscription_status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {complex.subscription_status === 'active' ? 'Al día' : 'Mora / Pendiente'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-sm font-mono ${isPastDue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                            {complex.billing_due_date ? new Date(complex.billing_due_date).toLocaleDateString() : '-'}
                                        </div>
                                        {isPastDue && (
                                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Vencido</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${complex.is_active
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${complex.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {complex.is_active ? 'Activo' : 'Suspendido'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openPaymentModal(complex)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="Registrar Pago"
                                            >
                                                <span className="font-bold text-xs">$</span>
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(complex.id, complex.is_active, complex.name)}
                                                className={`p-2 rounded-lg transition-all ${complex.is_active
                                                    ? 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                                                    : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                                    }`}
                                                title={complex.is_active ? 'Suspender Servicio (Kill Switch)' : 'Reactivar Servicio'}
                                            >
                                                <Power size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create Complex Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Nuevo Cliente</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Nombre" value={newComplex.name} onChange={e => setNewComplex({ ...newComplex, name: e.target.value })} required />
                            <input className="w-full border p-2 rounded" placeholder="NIT" value={newComplex.nit} onChange={e => setNewComplex({ ...newComplex, nit: e.target.value })} />
                            <input className="w-full border p-2 rounded" placeholder="Dirección" value={newComplex.address} onChange={e => setNewComplex({ ...newComplex, address: e.target.value })} />
                            <input className="w-full border p-2 rounded" placeholder="Ciudad" value={newComplex.city} onChange={e => setNewComplex({ ...newComplex, city: e.target.value })} />
                            <section className="bg-slate-50 p-3 rounded space-y-2">
                                <h3 className="text-xs font-bold uppercase text-slate-500">Administrador Inicial</h3>
                                <input className="w-full border p-2 rounded" type="email" placeholder="Email Admin" value={newComplex.admin_email} onChange={e => setNewComplex({ ...newComplex, admin_email: e.target.value })} required />
                                <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña" value={newComplex.admin_password} onChange={e => setNewComplex({ ...newComplex, admin_password: e.target.value })} required />
                            </section>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Crear</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentOpen && selectedComplex && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">Registrar Pago</h2>
                        <p className="text-sm text-slate-500 mb-4">Para: {selectedComplex.name}</p>

                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Monto</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded"
                                    value={paymentData.amount}
                                    onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Referencia / Notas</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={paymentData.reference}
                                    onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                                Al registrar el pago, la fecha de corte se extenderá automáticamente 30 días.
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" type="button" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                                <Button type="submit">Confirmar Pago</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
