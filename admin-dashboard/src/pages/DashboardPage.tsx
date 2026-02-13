import React, { useEffect, useState } from 'react';
import { Users, Car, AlertTriangle, Clock } from 'lucide-react';
import api from '../services/api';
import { Table } from '../components/ui/Table';

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
            {/* Change logic placeholder, ideally calculated vs last month */}
            <span className="text-slate-400">Total Actual</span>
        </div>
    </div>
);

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>({
        residents: 0,
        visitors: 0,
        parking: 0,
        alerts: 0
    });
    const [recentAccess, setRecentAccess] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/dashboard/overview');
            setStats(res.data.stats);
            setRecentAccess(res.data.recent_access);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Vista General</h1>
                <p className="text-slate-500">Bienvenido al panel de control de Residencial Altavista.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Residentes" value={stats.residents} icon={Users} color="bg-blue-500" />
                <StatCard title="Visitantes Activos" value={stats.visitors} icon={Users} color="bg-indigo-500" />
                <StatCard title="Ocupación Parqueadero" value={`${stats.parking}%`} icon={Car} color="bg-emerald-500" />
                <StatCard title="Alertas Seguridad (Hoy)" value={stats.alerts} icon={AlertTriangle} color="bg-red-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Accesos Recientes</h3>
                    <button onClick={fetchDashboardData} className="text-sm text-blue-600 hover:text-blue-800">Actualizar</button>
                </div>
                <div className="p-0">
                    <Table
                        columns={accessColumns}
                        data={recentAccess}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
};
