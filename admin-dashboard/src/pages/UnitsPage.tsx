
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Building, Users, Edit3, Trash2, X, Check, Settings } from 'lucide-react';
import api from '../services/api';
import { SecurityCodeModal } from '../components/common/SecurityCodeModal';

export const UnitsPage: React.FC = () => {
    const [structure, setStructure] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [showBlockModal, setShowBlockModal] = useState(false);

    // Security Modal State
    const [securityModal, setSecurityModal] = useState<{
        isOpen: boolean;
        unitId: number | null;
        action: 'delete' | null;
    }>({ isOpen: false, unitId: null, action: null });

    // Editing State
    const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ number: '', floor: '' });

    // Modal State for New Block
    const [formData, setFormData] = useState({
        blockName: '',
        floors: 5,
        unitsPerFloor: 4
    });

    // Rename Block State
    const [renamingBlock, setRenamingBlock] = useState<{ oldName: string, newName: string } | null>(null);

    // Reconfig Block State
    const [reconfigModal, setReconfigModal] = useState<{
        isOpen: boolean;
        blockName: string;
        floors: number;
        unitsPerFloor: number;
        currentUnits: any[];
    } | null>(null);

    const fetchStructure = async () => {
        try {
            const response = await api.get('/units/structure');
            setStructure(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching structure:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructure();
    }, []);

    const handleCreateBlock = async () => {
        if (!formData.blockName) return alert('Ingresa un nombre para el bloque');
        try {
            await api.post('/units/block', {
                ...formData,
                startNumber: 1
            });
            setShowBlockModal(false);
            fetchStructure();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
            alert('Error: ' + errorMsg);
        }
    };

    const handleRenameBlock = async () => {
        if (!renamingBlock || !renamingBlock.newName.trim()) return;
        try {
            await api.patch('/units/block/rename', {
                oldName: renamingBlock.oldName,
                newName: renamingBlock.newName
            });
            setRenamingBlock(null);
            fetchStructure();
        } catch (error: any) {
            alert('Error al renombrar: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleReconfigureBlock = async (securityCode?: string) => {
        if (!reconfigModal) return;
        try {
            await api.patch('/units/block/reconfigure', {
                blockName: reconfigModal.blockName,
                floors: reconfigModal.floors,
                unitsPerFloor: reconfigModal.unitsPerFloor,
                securityCode
            });
            setReconfigModal(null);
            setSecurityModal({ isOpen: false, unitId: null, action: null });
            fetchStructure();
        } catch (error: any) {
            alert('Error al reconfigurar: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateUnit = async (id: number) => {
        try {
            await api.put(`/units/${id}`, {
                number: editData.number,
                floor: Number(editData.floor)
            });
            setEditingUnitId(null);
            fetchStructure();
        } catch (error: any) {
            alert('Error al actualizar: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteUnit = async (securityCode: string) => {
        if (!securityModal.unitId) return;
        try {
            await api.delete(`/units/${securityModal.unitId}`, {
                data: { securityCode }
            });
            setSecurityModal({ isOpen: false, unitId: null, action: null });
            fetchStructure();
        } catch (error: any) {
            alert('Error al borrar: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Propiedades</h1>
                    <p className="text-slate-500 text-sm">Administra Torres y Apartamentos con control de seguridad</p>
                </div>
                <Button onClick={() => setShowBlockModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Bloque
                </Button>
            </div>

            {Object.keys(structure).length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No hay propiedades registradas</h3>
                    <p className="text-slate-500 mb-6">Comienza creando tu primera torre de apartamentos.</p>
                    <Button onClick={() => setShowBlockModal(true)}>Crear Bloque</Button>
                </div>
            ) : (
                <div className="grid gap-8">
                    {Object.entries(structure).map(([blockName, units]) => (
                        <div key={blockName} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Building size={20} />
                                    </div>
                                    {renamingBlock?.oldName === blockName ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="border rounded px-2 py-1 text-sm font-bold w-40"
                                                value={renamingBlock.newName}
                                                onChange={e => setRenamingBlock({ ...renamingBlock, newName: e.target.value })}
                                                autoFocus
                                            />
                                            <button onClick={handleRenameBlock} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={() => setRenamingBlock(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="group/title flex items-center gap-2">
                                            {blockName}
                                            <button
                                                onClick={() => setRenamingBlock({ oldName: blockName, newName: blockName })}
                                                className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                                            {units.length} Unidades
                                        </span>
                                        <button
                                            onClick={() => setReconfigModal({
                                                isOpen: true,
                                                blockName,
                                                floors: Math.max(...units.map((u: any) => u.floor)),
                                                unitsPerFloor: Math.max(...units.map((u: any) => Number(u.number.slice(-2)))),
                                                currentUnits: units
                                            })}
                                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                            title="Configurar Estructura"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {units.map((unit: any) => (
                                    <div
                                        key={unit.id}
                                        className="group relative p-4 border-2 border-slate-100 rounded-2xl bg-white hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
                                    >
                                        {editingUnitId === unit.id ? (
                                            <div className="space-y-2">
                                                <input
                                                    className="w-full text-xs p-1 border rounded font-bold"
                                                    value={editData.number}
                                                    onChange={e => setEditData({ ...editData, number: e.target.value })}
                                                    autoFocus
                                                />
                                                <input
                                                    type="number"
                                                    className="w-full text-[10px] p-1 border rounded"
                                                    value={editData.floor}
                                                    onChange={e => setEditData({ ...editData, floor: e.target.value })}
                                                    placeholder="Piso"
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleUpdateUnit(unit.id)}
                                                        className="flex-1 p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                    >
                                                        <Check size={12} className="mx-auto" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUnitId(null)}
                                                        className="flex-1 p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                                                    >
                                                        <X size={12} className="mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Action Buttons (Hover) */}
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUnitId(unit.id);
                                                            setEditData({ number: unit.number, floor: String(unit.floor) });
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setSecurityModal({ isOpen: true, unitId: unit.id, action: 'delete' })}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-lg font-black text-slate-900 tracking-tight">{unit.number}</span>
                                                    {unit.residents && unit.residents.length > 0 ? (
                                                        <div className="p-1 bg-emerald-50 rounded-md">
                                                            <Users size={16} className="text-emerald-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-2 w-2 rounded-full bg-slate-200 shadow-inner"></div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                        Piso {unit.floor}
                                                    </p>
                                                    {unit.residents && unit.residents.length > 0 && (
                                                        <span className="text-[9px] font-bold text-emerald-600">
                                                            {unit.residents.length} R
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create Block */}
            {
                showBlockModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Crear Nuevo Bloque/Torre</h2>
                                <button onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Nombre (Ej: Torre A)</label>
                                    <input
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                        value={formData.blockName}
                                        onChange={e => setFormData({ ...formData, blockName: e.target.value })}
                                        placeholder="Nombre del bloque..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Pisos</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                            value={formData.floors}
                                            onChange={e => setFormData({ ...formData, floors: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Aptos por Piso</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                            value={formData.unitsPerFloor}
                                            onChange={e => setFormData({ ...formData, unitsPerFloor: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <Button variant="secondary" className="flex-1" onClick={() => setShowBlockModal(false)}>Cancelar</Button>
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateBlock}>Crear Bloque</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* Security Code Modal for Deletion */}
            <SecurityCodeModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ isOpen: false, unitId: null, action: null })}
                title="Confirmación de Seguridad"
                message={securityModal.action === 'delete'
                    ? `¿Estás seguro que deseas eliminar esta unidad? Esta acción borrará todos los datos asociados y no se puede deshacer.`
                    : `Esta reconfiguración borrará unidades existentes. Por favor ingresa el código de seguridad para continuar.`
                }
                onConfirm={(code) => {
                    if (securityModal.action === 'delete') handleDeleteUnit(code);
                    else handleReconfigureBlock(code);
                }}
            />

            {/* Reconfigure Block Modal */}
            {
                reconfigModal?.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Reconfigurar {reconfigModal.blockName}</h2>
                                <button onClick={() => setReconfigModal(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Pisos</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                            value={reconfigModal.floors}
                                            onChange={e => setReconfigModal({ ...reconfigModal, floors: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Aptos por Piso</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                            value={reconfigModal.unitsPerFloor}
                                            onChange={e => setReconfigModal({ ...reconfigModal, unitsPerFloor: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {/* Warning if shrinking */}
                                {(() => {
                                    const targetCount = reconfigModal.floors * reconfigModal.unitsPerFloor;
                                    if (targetCount < reconfigModal.currentUnits.length) {
                                        return (
                                            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex gap-2 border border-red-100">
                                                <Trash2 size={16} />
                                                <p>Esta acción eliminará <strong>{reconfigModal.currentUnits.length - targetCount}</strong> unidades. Requiere código de seguridad.</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div className="flex justify-end gap-3 mt-8">
                                    <Button variant="secondary" className="flex-1" onClick={() => setReconfigModal(null)}>Cancelar</Button>
                                    <Button
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => {
                                            const targetCount = reconfigModal.floors * reconfigModal.unitsPerFloor;
                                            if (targetCount < reconfigModal.currentUnits.length) {
                                                setSecurityModal({ isOpen: true, unitId: null, action: null });
                                            } else {
                                                handleReconfigureBlock();
                                            }
                                        }}
                                    >
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};
