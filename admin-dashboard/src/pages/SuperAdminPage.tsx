import React, { useState, useEffect } from 'react';
import { Building2, Plus, Power, Search, Shield, Settings, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ModuleConfigModal } from '../components/superadmin/ModuleConfigModal';

export const SuperAdminPage: React.FC = () => {
    const [complexes, setComplexes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create Complex Modal
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newComplex, setNewComplex] = useState({
        name: '', nit: '', address: '', city: '',
        admin_document_num: '', admin_email: '', admin_password: '', plan_type: 'standard',
        deletion_passcode: ''
    });

    // Payment Modal
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedComplex, setSelectedComplex] = useState<any>(null);
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'transfer', reference: '' });

    // Module Config Modal
    const [isModuleOpen, setIsModuleOpen] = useState(false);

    // Loading State for Forms
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Complex Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editComplex, setEditComplex] = useState({
        id: 0, name: '', nit: '', address: '', city: '',
        admin_document_num: '', admin_email: '', admin_password: ''
    });

    const openEditModal = (complex: any) => {
        const adminUser = complex.users && complex.users.length > 0 ? complex.users[0] : null;

        setEditComplex({
            id: complex.id,
            name: complex.name,
            nit: complex.nit || '',
            address: complex.address || '',
            city: complex.city || '',
            admin_document_num: adminUser ? adminUser.document_num : '',
            admin_email: adminUser ? adminUser.email : '',
            admin_password: '' // leave blank unless changing
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/super-admin/complexes/${editComplex.id}`, editComplex);
            setIsEditOpen(false);
            fetchComplexes();
            toast.success('Cambios guardados correctamente');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al actualizar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchComplexes = async () => {
        try {
            console.log('Fetching complexes...');
            const response = await api.get('/super-admin/complexes');
            console.log('Complexes fetched:', response.data);
            setComplexes(response.data);
        } catch (error: any) {
            console.error('Error fetching complexes:', error);
            const msg = error.response?.data?.error || 'No se pudo conectar con el servidor';
            toast.error(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Edit Passcode Modal
    const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
    const [passcodeData, setPasscodeData] = useState({ id: 0, code: '' });

    const openPasscodeModal = (complex: any) => {
        setPasscodeData({ id: complex.id, code: complex.deletion_passcode || '' });
        setIsPasscodeOpen(true);
    };

    const openModuleModal = (complex: any) => {
        setSelectedComplex(complex);
        setIsModuleOpen(true);
    };

    const handleUpdatePasscode = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/super-admin/complexes/${passcodeData.id}`, { deletion_passcode: passcodeData.code });
            setIsPasscodeOpen(false);
            fetchComplexes();
            toast.success('Código de seguridad actualizado');
        } catch (error: any) {
            toast.error('Error al actualizar código');
        }
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/super-admin/complexes', newComplex);
            setIsFormOpen(false);
            setNewComplex({ name: '', nit: '', address: '', city: '', admin_document_num: '', admin_email: '', admin_password: '', plan_type: 'standard', deletion_passcode: '' } as any);
            fetchComplexes();
            toast.success('Conjunto creado exitosamente');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al crear');
        } finally {
            setIsSubmitting(false);
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
                <div className="overflow-x-auto block w-full">
                    <table className="w-full text-left min-w-[900px]">
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
                            {filteredComplexes.length > 0 ? (
                                filteredComplexes.map(complex => {
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
                                                <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(complex)}
                                                        className="p-2 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                                                        title="Editar Conjunto y Accesos"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModuleModal(complex)}
                                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"
                                                        title="Configurar Módulos"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openPaymentModal(complex)}
                                                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                        title="Registrar Pago"
                                                    >
                                                        <span className="font-bold text-xs">$</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openPasscodeModal(complex)}
                                                        className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                                        title="Configurar Código de Seguridad"
                                                    >
                                                        <Shield size={18} />
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
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 size={48} className="opacity-20" />
                                            <p>No se encontraron clientes registrados.</p>
                                            <Button variant="ghost" size="sm" onClick={fetchComplexes} className="mt-2">
                                                Reintentar cargar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModuleConfigModal
                isOpen={isModuleOpen}
                onClose={() => setIsModuleOpen(false)}
                complex={selectedComplex}
                onSuccess={fetchComplexes}
            />

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
                                <input className="w-full border p-2 rounded" type="text" placeholder="No. Documento (Cédula)" value={newComplex.admin_document_num} onChange={e => setNewComplex({ ...newComplex, admin_document_num: e.target.value })} required />
                                <input className="w-full border p-2 rounded" type="email" placeholder="Email Admin" value={newComplex.admin_email} onChange={e => setNewComplex({ ...newComplex, admin_email: e.target.value })} required />
                                <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña" value={newComplex.admin_password} onChange={e => setNewComplex({ ...newComplex, admin_password: e.target.value })} required />
                            </section>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Código de Seguridad (Borrados)</label>
                                <input className="w-full border p-2 rounded" placeholder="Ej: 9988" value={newComplex.deletion_passcode} onChange={e => setNewComplex({ ...newComplex, deletion_passcode: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </span>
                                    ) : (
                                        'Crear Cliente'
                                    )}
                                </Button>
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

            {/* Deletion Passcode Modal */}
            {isPasscodeOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600">
                            <Shield size={20} />
                            <h2 className="text-lg font-bold text-slate-900">Código de Seguridad</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Este código será requerido para borrar cualquier dato permanentemente en este conjunto.
                        </p>

                        <form onSubmit={handleUpdatePasscode} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Nuevo Código</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-center text-2xl font-mono tracking-widest"
                                    value={passcodeData.code}
                                    onChange={e => setPasscodeData({ ...passcodeData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" type="button" onClick={() => setIsPasscodeOpen(false)}>Cancelar</Button>
                                <Button type="submit">Actualizar Código</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Complex Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Editar Cliente</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Nombre" value={editComplex.name} onChange={e => setEditComplex({ ...editComplex, name: e.target.value })} required />
                            <input className="w-full border p-2 rounded" placeholder="NIT" value={editComplex.nit} onChange={e => setEditComplex({ ...editComplex, nit: e.target.value })} />
                            <input className="w-full border p-2 rounded" placeholder="Dirección" value={editComplex.address} onChange={e => setEditComplex({ ...editComplex, address: e.target.value })} />
                            <input className="w-full border p-2 rounded" placeholder="Ciudad" value={editComplex.city} onChange={e => setEditComplex({ ...editComplex, city: e.target.value })} />
                            <section className="bg-orange-50/50 p-3 rounded space-y-2 border border-orange-100">
                                <h3 className="text-xs font-bold uppercase text-orange-600">Credenciales del Administrador</h3>
                                <p className="text-xs text-slate-500 mb-2">Deja la contraseña en blanco si no deseas cambiarla.</p>

                                <label className="block text-xs font-bold text-slate-500 mt-2">Cédula del Admin</label>
                                <input className="w-full border p-2 rounded" type="text" placeholder="No. Documento (Cédula)" value={editComplex.admin_document_num} onChange={e => setEditComplex({ ...editComplex, admin_document_num: e.target.value })} />

                                <label className="block text-xs font-bold text-slate-500 mt-2">Email del Admin</label>
                                <input className="w-full border p-2 rounded" type="email" placeholder="Email Admin" value={editComplex.admin_email} onChange={e => setEditComplex({ ...editComplex, admin_email: e.target.value })} />

                                <label className="block text-xs font-bold text-slate-500 mt-2">Corregir Contraseña</label>
                                <input className="w-full border p-2 rounded placeholder:text-slate-300" type="password" placeholder="Escribe nueva contraseña (Opcional)" value={editComplex.admin_password} onChange={e => setEditComplex({ ...editComplex, admin_password: e.target.value })} />
                            </section>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </span>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
