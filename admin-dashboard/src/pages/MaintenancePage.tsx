import React, { useState, useEffect } from 'react';
import {
    Wrench,
    Plus,
    Search,
    Calendar,
    Settings,
    CheckCircle2,
    Clock,
    ChevronRight,
    Users,
    FileText,
    QrCode,
    LayoutGrid,
    DollarSign
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

import { MaintenanceItemModal } from '../components/maintenance/MaintenanceItemModal';
import { MaintenanceTaskModal } from '../components/maintenance/MaintenanceTaskModal';
import { TaskCompletionModal } from '../components/maintenance/TaskCompletionModal';

export const MaintenancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [items, setItems] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [itemsRes, tasksRes, providersRes] = await Promise.all([
                api.get('/maintenance/items'),
                api.get('/maintenance/tasks'),
                api.get('/maintenance/providers')
            ]);
            setItems(itemsRes.data || []);
            setTasks(tasksRes.data || []);
            setProviders(providersRes.data || []);
        } catch (error) {
            console.error('Error fetching maintenance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenItemModal = (item: any = null) => {
        setSelectedItem(item);
        setIsItemModalOpen(true);
    };

    const handleOpenTaskModal = () => {
        setIsTaskModalOpen(true);
    };

    const handleOpenCompleteModal = (task: any) => {
        setSelectedTask(task);
        setIsCompleteModalOpen(true);
    };

    if (isLoading) return <div className="flex items-center justify-center h-96">Cargando datos de mantenimiento...</div>;

    const stats = [
        { title: 'Activos Totales', value: items.length, icon: Settings, color: 'blue' },
        { title: 'Tareas Pendientes', value: tasks.filter(t => t.status === 'pending').length, icon: Clock, color: 'amber' },
        { title: 'Mantenimientos (30d)', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'emerald' },
        { title: 'Presupuesto Usado', value: `$${tasks.reduce((acc, t) => acc + (t.cost || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'blue' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mantenimiento y Activos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de infraestructura, tareas preventivas y proveedores.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleOpenTaskModal()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-on-primary px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Wrench size={18} />
                        Programar Tarea
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all">
                        <Plus size={18} />
                        Reportar Falla
                    </button>
                </div>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Resumen', icon: LayoutGrid },
                    { id: 'inventory', label: 'Inventario de Activos', icon: Settings },
                    { id: 'scheduler', label: 'Programador de Tareas', icon: Calendar },
                    { id: 'providers', label: 'Directorio de Proveedores', icon: Users },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-8">
                {activeTab === 'overview' && <MaintenanceDashboard tasks={tasks} onCompleteTask={handleOpenCompleteModal} />}
                {activeTab === 'inventory' && <AssetInventory items={items} onAdd={() => handleOpenItemModal()} onEdit={handleOpenItemModal} />}
                {activeTab === 'scheduler' && <TaskScheduler tasks={tasks} onComplete={handleOpenCompleteModal} onAdd={handleOpenTaskModal} />}
                {activeTab === 'providers' && <ProviderList providers={providers} />}
            </div>

            {/* Modals */}
            <MaintenanceItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSuccess={fetchData}
                initialData={selectedItem}
            />
            <MaintenanceTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSuccess={fetchData}
                items={items}
                providers={providers}
            />
            <TaskCompletionModal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                onSuccess={fetchData}
                task={selectedTask}
            />
        </div>
    );
};

// --- Sub-components ---

const MaintenanceDashboard: React.FC<{ tasks: any[], onCompleteTask: (task: any) => void }> = ({ tasks, onCompleteTask }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Tasks */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Próximos Mantenimientos</h3>
                        <button className="text-primary-600 text-sm font-semibold hover:underline">Ver todo</button>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {tasks.slice(0, 5).map(task => (
                            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        task.type === 'preventive' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                                    )}>
                                        <Wrench size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{task.title}</p>
                                        <p className="text-xs text-slate-500">{task.item?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-700">{new Date(task.scheduled_date).toLocaleDateString()}</p>
                                        <span className={clsx(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                            task.priority === 'high' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {task.priority || 'media'}
                                        </span>
                                    </div>
                                    {task.status === 'pending' && (
                                        <button
                                            onClick={() => onCompleteTask(task)}
                                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                            title="Completar"
                                        >
                                            <CheckCircle2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Asset Health Overview */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Estado de la Infraestructura</h3>
                    <div className="space-y-6">
                        {['Elevadores', 'Motobombas', 'Seguridad', 'Zonas Verdes'].map((cat) => (
                            <div key={cat} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">{cat}</span>
                                    <span className="text-emerald-600 font-bold">100%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AssetInventory: React.FC<{ items: any[], onAdd: () => void, onEdit: (item: any) => void }> = ({ items, onAdd, onEdit }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar activo (nombre, marca o serial)..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 text-primary-600 bg-primary-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors"
            >
                <Plus size={16} />
                Agregar Activo
            </button>
        </div>
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-4">Activo</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Cald. Mantenimiento</th>
                    <th className="px-6 py-4">Garantía</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">QR</th>
                    <th className="px-6 py-4">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.brand} {item.model}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{item.category}</td>
                        <td className="px-6 py-4">
                            <span className="text-slate-500 flex items-center gap-1">
                                <Clock size={14} />
                                Cada 6 meses
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {item.warranty_until ? (
                                <span className="text-emerald-600 font-medium">
                                    {new Date(item.warranty_until).toLocaleDateString()}
                                </span>
                            ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                            <span className={clsx(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                item.status === 'operational' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {item.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-600 transition-colors">
                                <QrCode size={20} />
                            </button>
                        </td>
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEdit(item)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-primary-600"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TaskScheduler: React.FC<{ tasks: any[], onComplete: (task: any) => void, onAdd: () => void }> = ({ tasks, onComplete, onAdd }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Calendario de Tareas</h3>
                <div className="flex gap-2">
                    <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 text-on-primary px-4 py-2 rounded-lg text-sm font-bold">
                        <Plus size={16} /> Programar
                    </button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-center h-64 text-slate-400 italic">
                    [Vista de Calendario próximamente]
                </div>
            </div>
        </div>
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Cola de Pendientes</h3>
            <div className="space-y-3">
                {tasks.filter(t => t.status === 'pending').map(task => (
                    <div key={task.id} className="p-4 bg-white rounded-xl border border-slate-200 premium-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                task.priority === 'high' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                            )}>
                                {task.priority || 'media'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(task.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-slate-900">{task.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{task.item?.name}</p>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => onComplete(task)}
                                className="flex-1 bg-primary-600 text-on-primary py-1.5 rounded-lg text-xs font-bold hover:bg-primary-700"
                            >
                                Completar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ProviderList: React.FC<{ providers: any[] }> = ({ providers }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-primary-200 transition-all flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                        <Users size={24} />
                    </div>
                    <h4 className="font-bold text-lg text-slate-900">{p.name}</h4>
                    <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-2">{p.specialty}</p>
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileText size={16} className="text-slate-400" />
                            <span>NIT: {p.nit}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users size={16} className="text-slate-400" />
                            <span>{p.contact_name}</span>
                        </div>
                    </div>
                </div>
                <button className="mt-6 w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-primary-600 hover:text-white transition-all">Ver Historial de Trabajos</button>
            </div>
        ))}
    </div>
);

const StatCard: React.FC<{ title: string, value: string | number, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
        emerald: "bg-emerald-50 text-emerald-600"
    };
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={clsx("p-3 rounded-xl", colors[color])}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">{value}</h4>
            </div>
        </div>
    );
};
