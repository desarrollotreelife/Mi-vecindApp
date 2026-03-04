import React, { useState, useEffect } from 'react';
import { Car, Plus, Trash2, Settings, Edit, Users, Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import clsx from 'clsx';

export const ParkingPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState<number>(1);
    const [activeFilter, setActiveFilter] = useState('all'); // all, available, occupied, resident, visitor
    const [configMode, setConfigMode] = useState(false);

    // Modals state
    const [assignModal, setAssignModal] = useState<{ open: boolean, slot: any }>({ open: false, slot: null });
    const [targetUnit, setTargetUnit] = useState('');

    // Bulk Create State
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkData, setBulkData] = useState({ prefix: 'A-', start: 1, end: 10, floor: 1, type: 'resident' });

    // Edit Slot State
    const [editSlot, setEditSlot] = useState<{ open: boolean, slot: any | null }>({ open: false, slot: null });
    const [editData, setEditData] = useState({ code: '', type: 'visitor' });

    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            setError(null);
            const response = await api.get('/parking/status');
            setData(response.data);
            setLoading(false);
        } catch (error: any) {
            console.error('Error fetching parking status:', error);
            setError(error.response?.data?.error || error.message || 'Error desconocido');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleEntry = async (slotId: number) => {
        const plate = prompt('Ingrese placa del vehículo:');
        if (!plate) return;

        try {
            await api.post('/parking/entry', { slotId, plate, type: 'visitor' });
            fetchStatus();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al registrar entrada');
        }
    };

    const handleExit = async (slotId: number) => {
        if (!confirm('¿Confirmar salida del vehículo?')) return;
        try {
            await api.post('/parking/exit', { slotId });
            fetchStatus();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al registrar salida');
        }
    };

    const handleAssign = async () => {
        try {
            await api.post('/parking/assign', {
                slotId: assignModal.slot.id,
                unitId: targetUnit ? Number(targetUnit) : null
            });
            setAssignModal({ open: false, slot: null });
            fetchStatus();
        } catch (error: any) {
            alert('Error asignando: ' + error.response?.data?.error);
        }
    };

    const handleBulkCreate = async () => {
        try {
            await api.post('/parking/slots/bulk', bulkData);
            setBulkModal(false);
            fetchStatus();
        } catch (error: any) {
            alert('Error creating slots: ' + error.response?.data?.error);
        }
    };

    const handleDeleteSlot = async (id: number) => {
        if (!confirm('¿Eliminar esta celda permanentemente?')) return;
        try {
            await api.delete(`/parking/slots/${id}`);
            fetchStatus();
        } catch (error: any) {
            alert('Error: ' + error.response?.data?.error);
        }
    };

    const handleUpdateSlot = async () => {
        if (!editSlot.slot) return;
        try {
            await api.put(`/parking/slots/${editSlot.slot.id}`, editData);
            setEditSlot({ open: false, slot: null });
            fetchStatus();
        } catch (error: any) {
            alert('Error updating slot: ' + error.response?.data?.error);
        }
    };

    const openEditModal = (slot: any) => {
        setEditData({ code: slot.code, type: slot.type });
        setEditSlot({ open: true, slot });
    };

    const { user } = useAuth();
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
    const isAdmin = roleName.toLowerCase() === 'admin';

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    if (error) return (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200 m-4">
            <h3 className="text-red-800 font-bold text-lg mb-2">Error al cargar parqueadero</h3>
            <p className="text-red-600 font-mono text-sm">{error}</p>
            <Button className="mt-4" onClick={fetchStatus}>Reintentar</Button>
        </div>
    );

    if (!data || !data.slots) return <div className="p-6 text-orange-500">No se encontraron datos.</div>;

    // Group by floor
    const activeFloors = [...new Set(data.slots.map((s: any) => s.floor))].sort((a: any, b: any) => a - b);
    const floors = activeFloors.length > 0 ? activeFloors : [1];

    let currentSlots = data.slots.filter((s: any) => s.floor === selectedFloor);

    // Filter Logic
    if (activeFilter === 'available') currentSlots = currentSlots.filter((s: any) => !s.is_occupied);
    if (activeFilter === 'occupied') currentSlots = currentSlots.filter((s: any) => s.is_occupied);
    if (activeFilter === 'resident') currentSlots = currentSlots.filter((s: any) => s.type === 'resident');
    if (activeFilter === 'visitor') currentSlots = currentSlots.filter((s: any) => s.type === 'visitor');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Car className="text-indigo-600" /> Control de Parqueadero
                    </h1>
                    <p className="text-slate-500 text-sm">Gestión visual de celdas y vehículos</p>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {!configMode && (
                        <div className="flex gap-2 mr-4">
                            <Badge variant="success" className="px-3 py-1">Libres: {data.summary.available}</Badge>
                            <Badge variant="error" className="px-3 py-1">Ocupados: {data.summary.occupied}</Badge>
                        </div>
                    )}
                    <Button
                        variant={configMode ? 'secondary' : 'outline'}
                        onClick={() => setConfigMode(!configMode)}
                        size="sm"
                        disabled={!isAdmin}
                        title={!isAdmin ? "Solo administradores pueden configurar" : ""}
                        className={!isAdmin ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        <Settings size={16} className="mr-2" />
                        {configMode ? 'Salir Configuración' : 'Configurar'}
                    </Button>
                    {configMode && (
                        <Button onClick={() => setBulkModal(true)} size="sm">
                            <Plus size={16} className="mr-2" /> Crear Bloque
                        </Button>
                    )}
                </div>
            </div>

            {/* Controls & Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Floor Selector */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {floors.map((floor: any) => (
                        <button
                            key={floor}
                            onClick={() => setSelectedFloor(floor)}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                selectedFloor === floor
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                            )}
                        >
                            {floor === -1 ? 'Sótano 1' : floor === 0 ? 'PB' : `Piso ${floor}`}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    {['all', 'available', 'occupied', 'resident', 'visitor'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={clsx(
                                "px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all",
                                activeFilter === filter
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Map */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 min-h-[400px]">
                {currentSlots.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                        <Grid size={48} className="mb-4 opacity-20" />
                        <p>No hay celdas visibles en este filtro/piso.</p>
                        {configMode && (
                            <Button variant="outline" className="mt-4" onClick={() => setBulkModal(true)}>
                                Crear Celdas en Piso {selectedFloor}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {currentSlots.map((slot: any) => (
                            <div
                                key={slot.id}
                                className={clsx(
                                    "relative rounded-lg border-2 transition-all p-3 flex flex-col justify-between min-h-[120px] shadow-sm",
                                    configMode ? "cursor-move border-dashed" : "cursor-pointer hover:shadow-md hover:-translate-y-1",
                                    slot.is_occupied
                                        ? "bg-red-50 border-red-200"
                                        : slot.type === 'resident'
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-emerald-50 border-emerald-200"
                                )}
                                onClick={() => !configMode && !slot.is_occupied && slot.type === 'visitor' && handleEntry(slot.id)}
                            >
                                {/* Header: Code & Type Icon */}
                                <div className="flex justify-between items-start">
                                    <span className={clsx(
                                        "font-bold text-lg",
                                        slot.is_occupied ? "text-red-700" : slot.type === 'resident' ? "text-blue-700" : "text-emerald-700"
                                    )}>
                                        {slot.code}
                                    </span>
                                    {slot.type === 'resident' ? <Users size={16} className="text-blue-400" /> : <Users size={16} className="text-emerald-400" />}
                                </div>

                                {/* Content: Status or Vehicle */}
                                <div className="flex-1 flex flex-col items-center justify-center my-2">
                                    {slot.is_occupied ? (
                                        <>
                                            <Car size={32} className="text-red-500" />
                                            <span className="text-xs font-bold bg-white px-1 rounded mt-1 shadow-sm border border-red-100">
                                                {slot.usages[0]?.vehicle?.plate || '???'}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="text-center opacity-50">
                                            <div className="text-[10px] uppercase tracking-wider font-semibold">
                                                {slot.type}
                                            </div>
                                            {slot.type === 'resident' && slot.unit && (
                                                <div className="text-xs font-bold text-blue-600">
                                                    {slot.unit.block ? `${slot.unit.block}-${slot.unit.number}` : slot.unit.number}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end items-center gap-2 pt-2 border-t border-black/5">
                                    {configMode ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(slot); }} className="text-slate-400 hover:text-blue-600">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="text-slate-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="text-[10px] text-slate-500 hover:text-indigo-600 underline"
                                                onClick={(e) => { e.stopPropagation(); setAssignModal({ open: true, slot }); }}
                                            >
                                                {slot.type === 'resident' ? (slot.unit ? 'Cambiar' : 'Asignar') : 'Convertir'}
                                            </button>
                                            {slot.is_occupied && (
                                                <button
                                                    className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded hover:bg-red-200"
                                                    onClick={(e) => { e.stopPropagation(); handleExit(slot.id); }}
                                                >
                                                    Salida
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}

            {/* 1. Assign Modal */}
            {assignModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Asignar Celda {assignModal.slot?.code}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-600">ID Unidad (Apartamento)</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ej: 15 (ID interno)"
                                    value={targetUnit}
                                    onChange={e => setTargetUnit(e.target.value)}
                                    type="number"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Dejar vacío para configurar como <strong>Visitantes</strong> (público).
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setAssignModal({ open: false, slot: null })}>Cancelar</Button>
                                <Button onClick={handleAssign}>Guardar</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* 2. Bulk Create Modal */}
            {bulkModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Creación Masiva de Celdas</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Prefijo</label>
                                    <input
                                        className="w-full border rounded p-2"
                                        value={bulkData.prefix}
                                        onChange={e => setBulkData({ ...bulkData, prefix: e.target.value })}
                                        placeholder="ej: A-"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Piso</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2"
                                        value={bulkData.floor}
                                        onChange={e => setBulkData({ ...bulkData, floor: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Inicio (N°)</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2"
                                        value={bulkData.start}
                                        onChange={e => setBulkData({ ...bulkData, start: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Fin (N°)</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2"
                                        value={bulkData.end}
                                        onChange={e => setBulkData({ ...bulkData, end: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tipo Predeterminado</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={bulkData.type}
                                    onChange={e => setBulkData({ ...bulkData, type: e.target.value })}
                                >
                                    <option value="resident">Residentes (Privado)</option>
                                    <option value="visitor">Visitantes (Común)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                                <Button variant="ghost" onClick={() => setBulkModal(false)}>Cancelar</Button>
                                <Button onClick={handleBulkCreate}>
                                    Crear {bulkData.end - bulkData.start + 1} Celdas
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* 3. Edit Slot Modal */}
            {editSlot.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Editar Celda</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Código Visual</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={editData.code}
                                    onChange={e => setEditData({ ...editData, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={editData.type}
                                    onChange={e => setEditData({ ...editData, type: e.target.value })}
                                >
                                    <option value="resident">Residentes</option>
                                    <option value="visitor">Visitantes</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setEditSlot({ open: false, slot: null })}>Cancelar</Button>
                                <Button onClick={handleUpdateSlot}>Guardar Cambios</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
