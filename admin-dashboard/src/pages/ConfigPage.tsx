import { useState, useEffect } from 'react';
import { Plus, Shield, User, Edit, FileText, Clock, CreditCard } from 'lucide-react';
import { Table } from '../components/ui/Table';
import { UserForm } from '../components/config/UserForm';
import { ShiftForm } from '../components/config/ShiftForm';
import { PaymentConfigForm } from '../components/config/PaymentConfigForm';
import api from '../services/api';
import clsx from 'clsx';

export const ConfigPage = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'shifts' | 'payments' | 'audit'>('users');
    const [showForm, setShowForm] = useState(false);
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedShift, setSelectedShift] = useState<any>(null);
    const [stats, setStats] = useState({ total_system_users: 0, active_guards: 0, logs_today: 0 });

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await api.get('/config/users');
                setUsers(res.data);
            } else if (activeTab === 'shifts') {
                const res = await api.get('/config/shifts');
                setShifts(res.data);
            } else if (activeTab === 'audit') {
                const res = await api.get('/config/audit-logs');
                setAuditLogs(res.data);
            } else if (activeTab === 'payments') {
                // Payment config is fetched by the component itself, so we just stop loading
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (activeTab !== 'payments') setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/config/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateUser = async (data: any) => {
        await api.post('/config/users', data);
        setShowForm(false);
        fetchData();
        fetchStats();
    };

    const handleUpdateUser = async (data: any) => {
        if (!selectedUser) return;
        await api.put(`/config/users/${selectedUser.id}`, data);
        setShowForm(false);
        setSelectedUser(null);
        fetchData();
    };

    const handleCreateShift = async (data: any) => {
        await api.post('/config/shifts', data);
        setShowForm(false);
        fetchData();
    };

    const handleUpdateShift = async (data: any) => {
        if (!selectedShift) return;
        await api.put(`/config/shifts/${selectedShift.id}`, data);
        setShowForm(false);
        setSelectedShift(null);
        fetchData();
    };

    const userColumns = [
        {
            header: 'Usuario',
            accessor: 'full_name',
            render: (value: any, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                        {row.profile_photo ? (
                            <img
                                src={`http://localhost:3001${row.profile_photo}`}
                                alt={value}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={20} className="text-slate-400" />
                        )}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{value}</div>
                        <div className="text-xs text-slate-500">{row.email}</div>
                        <div className="text-xs text-slate-400">ID: {row.document_num}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Rol / Cargo',
            accessor: 'role',
            render: (role: any, row: any) => (
                <div>
                    <div className="flex items-center gap-1.5">
                        {role?.id === 2 ? (
                            <Shield size={14} className="text-blue-600" />
                        ) : (
                            <Shield size={14} className="text-green-600" />
                        )}
                        <span className={role?.id === 2 ? "text-blue-700 font-medium" : "text-green-700 font-medium"}>
                            {role?.id === 2 ? 'Administrador' : 'Guardia'}
                        </span>
                    </div>
                    {row.position && <div className="text-xs text-slate-500 mt-0.5">{row.position}</div>}
                    {row.shift && (
                        <div className="text-xs text-slate-400 mt-0.5 capitalize">
                            Turno: {row.shift === 'morning' ? 'Mañana' : row.shift === 'afternoon' ? 'Tarde' : 'Noche'}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            accessor: 'status',
            render: (value: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {value === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            className: 'w-20',
            render: (_: any, row: any) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectedUser(row); setShowForm(true); }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    {/* Only super admin would have delete/deactivate, for now allowing basic interaction */}
                </div>
            )
        }
    ];

    const auditColumns = [
        {
            header: 'Fecha/Hora',
            accessor: 'created_at',
            render: (value: string) => (
                <div className="text-sm">
                    <div className="text-slate-900">{new Date(value).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500">{new Date(value).toLocaleTimeString()}</div>
                </div>
            )
        },
        {
            header: 'Usuario',
            accessor: 'user',
            render: (user: any) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{user?.full_name || 'Sistema'}</span>
                </div>
            )
        },
        {
            header: 'Módulo',
            accessor: 'module',
            render: (value: string) => (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono uppercase">
                    {value}
                </span>
            )
        },
        {
            header: 'Acción',
            accessor: 'action',
            render: (value: string) => <span className="text-xs font-bold text-slate-700">{value}</span>
        },
        {
            header: 'Descripción',
            accessor: 'description',
            render: (value: string) => <span className="text-sm text-slate-600">{value}</span>
        }
    ];

    const shiftColumns = [
        {
            header: 'Nombre del Turno',
            accessor: 'name',
            render: (value: string) => <span className="font-bold text-slate-700">{value}</span>
        },
        {
            header: 'Horario',
            accessor: 'start_time',
            render: (_: any, row: any) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={16} />
                    <span>{row.start_time} - {row.end_time}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            accessor: 'is_active',
            render: (active: boolean) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {active ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            className: 'w-20',
            render: (_: any, row: any) => (
                <button
                    onClick={() => { setSelectedShift(row); setShowForm(true); }}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
                >
                    <Edit size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h1>
                    <p className="text-slate-500">Gestión de usuarios y sistema</p>
                </div>
                {!showForm && activeTab !== 'payments' && (
                    <button
                        onClick={() => {
                            if (activeTab === 'users') { setSelectedUser(null); }
                            if (activeTab === 'shifts') { setSelectedShift(null); }
                            setShowForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        {activeTab === 'users' ? 'Nuevo Usuario' : 'Nuevo'}
                    </button>
                )}
            </div>

            {/* Stats Cards (simplified for now) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><User size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.total_system_users}</div>
                        <div className="text-sm text-slate-500">Usuarios del Sistema</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Shield size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.active_guards}</div>
                        <div className="text-sm text-slate-500">Guardias Activos</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.logs_today}</div>
                        <div className="text-sm text-slate-500">Acciones Hoy</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 flex overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab('users'); setShowForm(false); }}
                        className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'users' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50")}
                    >
                        Usuarios del Sistema
                    </button>
                    <button
                        onClick={() => { setActiveTab('shifts'); setShowForm(false); }}
                        className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'shifts' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50")}
                    >
                        Turnos de Guardias
                    </button>
                    <button
                        onClick={() => { setActiveTab('payments'); setShowForm(false); }}
                        className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'payments' ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-500 hover:bg-slate-50")}
                    >
                        Configurar Pagos
                    </button>
                    <button
                        onClick={() => { setActiveTab('audit'); setShowForm(false); }}
                        className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'audit' ? "border-purple-600 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50")}
                    >
                        Auditoría
                    </button>
                </div>

                <div className="p-6">
                    {showForm ? (
                        <div>
                            <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                                <span className="cursor-pointer hover:text-blue-600" onClick={() => setShowForm(false)}>
                                    {activeTab === 'users' ? 'Usuarios' : 'Turnos'}
                                </span>
                                <span>/</span>
                                <span className="text-slate-800 font-medium">
                                    {activeTab === 'users'
                                        ? (selectedUser ? 'Editar Usuario' : 'Nuevo Usuario')
                                        : (selectedShift ? 'Editar Turno' : 'Nuevo Turno')
                                    }
                                </span>
                            </div>

                            {activeTab === 'users' && (
                                <UserForm
                                    onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
                                    onCancel={() => { setShowForm(false); setSelectedUser(null); }}
                                    initialData={selectedUser}
                                />
                            )}
                            {activeTab === 'shifts' && (
                                <ShiftForm
                                    onSubmit={selectedShift ? handleUpdateShift : handleCreateShift}
                                    onCancel={() => { setShowForm(false); setSelectedShift(null); }}
                                    initialData={selectedShift}
                                />
                            )}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'users' && <Table columns={userColumns} data={users} loading={loading} />}
                            {activeTab === 'shifts' && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-blue-800">Esquema de Turnos</h3>
                                        <p className="text-sm text-blue-600">Configura rápida: Elige entre turnos de 8h o 12h.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (confirm('¿Restablecer a 3 turnos (8h)? Esto borrará la configuración actual.')) {
                                                    await api.post('/config/shifts/reset', { mode: '3-shifts' });
                                                    fetchData();
                                                }
                                            }}
                                            className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            3 Turnos (8h)
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('¿Restablecer a 2 turnos (12h)? Esto borrará la configuración actual.')) {
                                                    await api.post('/config/shifts/reset', { mode: '2-shifts' });
                                                    fetchData();
                                                }
                                            }}
                                            className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            2 Turnos (12h)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'shifts' && <Table columns={shiftColumns} data={shifts} loading={loading} />}

                            {activeTab === 'payments' && (
                                <div className="animate-fade-in">
                                    <PaymentConfigForm />
                                </div>
                            )}

                            {activeTab === 'audit' && <Table columns={auditColumns} data={auditLogs} loading={loading} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
