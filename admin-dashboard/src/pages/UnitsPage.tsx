
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Building, Users } from 'lucide-react';
import api from '../services/api';

export const UnitsPage: React.FC = () => {
    const [structure, setStructure] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [showBlockModal, setShowBlockModal] = useState(false);

    // Modal State
    const [formData, setFormData] = useState({
        blockName: '',
        floors: 5,
        unitsPerFloor: 4
    });

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
        try {
            await api.post('/units/block', {
                ...formData,
                startNumber: 1
            });
            setShowBlockModal(false);
            fetchStructure();
            alert('Bloque creado exitosamente');
        } catch (error: any) {
            alert('Error: ' + error.response?.data?.error);
        }
    };

    if (loading) return <div>Cargando propiedades...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Propiedades</h1>
                    <p className="text-slate-500">Administra Torres y Apartamentos</p>
                </div>
                <Button onClick={() => setShowBlockModal(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Bloque
                </Button>
            </div>

            {Object.keys(structure).length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No hay propiedades registradas</h3>
                    <p className="text-slate-500 mb-6">Comienza creando tu primera torre de apartamentos.</p>
                    <Button onClick={() => setShowBlockModal(true)}>Crear Bloque</Button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(structure).map(([blockName, units]) => (
                        <Card key={blockName} className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Building className="text-indigo-600" />
                                {blockName}
                                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {units.length} Unidades
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {units.map((unit: any) => (
                                    <div key={unit.id} className="p-3 border rounded-lg hover:border-indigo-500 cursor-pointer transition-colors bg-white">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900">{unit.number}</span>
                                            {unit.residents && unit.residents.length > 0 ? (
                                                <Users size={14} className="text-green-500" />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-slate-200"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">
                                            Piso {unit.floor}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Create Block */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Crear Nuevo Bloque/Torre</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre (Ej: Torre A)</label>
                                <input
                                    className="w-full p-2 border rounded"
                                    value={formData.blockName}
                                    onChange={e => setFormData({ ...formData, blockName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Pisos</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded"
                                        value={formData.floors}
                                        onChange={e => setFormData({ ...formData, floors: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Aptos por Piso</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded"
                                        value={formData.unitsPerFloor}
                                        onChange={e => setFormData({ ...formData, unitsPerFloor: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="secondary" onClick={() => setShowBlockModal(false)}>Cancelar</Button>
                                <Button onClick={handleCreateBlock}>Crear Bloque</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
