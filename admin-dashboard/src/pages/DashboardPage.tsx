import React, { useEffect, useState } from 'react';
import { Users, Car, AlertTriangle, Clock, TrendingUp, DollarSign, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../services/api';
import { Table } from '../components/ui/Table';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">Total Actual</span>
        </div>
    </div>
);

export const DashboardPage: React.FC = () => {
    const [data, setData] = useState<any>({
        stats: { residents: 0, visitors: 0, parking: 0, alerts: 0 },
        recentAccess: [],
        financial: { history: [], delinquency: [] },
        parkingDistribution: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/dashboard/overview');
            setData({
                stats: res.data.stats,
                recentAccess: res.data.recent_access,
                financial: res.data.financial,
                parkingDistribution: res.data.parking_distribution
            });
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const accessColumns = [
        {
            header: 'Hora',
            accessor: 'timestamp',
            render: (val: string) => <div className="flex items-center gap-2 text-slate-600"><Clock size={14} /> {new Date(val).toLocaleTimeString()}</div>
        },
        {
            header: 'Usuario / Visitante',
            accessor: 'id',
            render: (_: any, row: any) => (
                <span className="font-medium text-slate-800">
                    {row.user?.full_name || row.visit?.visitor?.name || 'Desconocido'}
                </span>
            )
        },
        {
            header: 'Punto de Acceso',
            accessor: 'access_point',
            render: (ap: any) => ap?.name || 'Entrada Principal'
        },
        {
            header: 'Método',
            accessor: 'method',
            render: (val: string) => <span className="uppercase text-xs font-mono bg-slate-100 px-2 py-1 rounded">{val}</span>
        },
        {
            header: 'Estado',
            accessor: 'success',
            render: (success: boolean) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {success ? 'AUTORIZADO' : 'DENEGADO'}
                </span>
            )
        }
    ];

    const { user } = api.defaults.headers.common['Authorization'] ? { user: JSON.parse(localStorage.getItem('user') || '{}') } : { user: {} as any };
    // Actually we should use useAuth() but the file already imports api.
    // Let's use useAuth if it exists or fallback.
    // DashboardPage.tsx doesn't import useAuth. Let's add it.

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {user?.complex?.name || 'Panel de Control'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Bienvenido, gestiona tu copropiedad de forma eficiente.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                        <TrendingUp size={20} />
                    </div>
                    <div className="pr-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Estado General</p>
                        <p className="text-sm font-bold text-emerald-600">CRECIENTE</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Residentes" value={data.stats.residents} icon={Users} color="bg-blue-500" />
                <StatCard title="Visitantes Activos" value={data.stats.visitors} icon={Users} color="bg-indigo-500" />
                <StatCard title="Ocupación Parqueadero" value={`${data.stats.parking}%`} icon={Car} color="bg-emerald-500" />
                <StatCard title="Alertas Seguridad (Hoy)" value={data.stats.alerts} icon={AlertTriangle} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <DollarSign size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Flujo de Caja (6 meses)</h3>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.financial.history}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={2} />
                                <Area type="monotone" dataKey="gastos" stroke="#ef4444" fill="transparent" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Delinquency Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                <PieIcon size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Estado de Carteras</h3>
                        </div>
                    </div>
                    <div className="h-64 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.financial.delinquency}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.financial.delinquency.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Access Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800">Accesos Recientes</h3>
                        <button onClick={fetchDashboardData} className="text-sm text-blue-600 hover:text-blue-800">Actualizar</button>
                    </div>
                    <div className="p-0">
                        <Table
                            columns={accessColumns}
                            data={data.recentAccess}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Parking Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Ocupación Parqueadero</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.parkingDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
