import React, { useState, useEffect } from 'react';
import { BuildingExplorer3D } from '../components/3d/BuildingExplorer3D';
import clsx from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

import { Home, Users, X, AlertTriangle, Building as BuildingIcon, Percent } from 'lucide-react';
import api from '../services/api';
import { getSocket, joinComplexRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const Visualizer3DPage: React.FC = () => {
    const { user } = useAuth();
    const [structure, setStructure] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [alertUnits, setAlertUnits] = useState<Set<number>>(new Set());


    const fetchStructure = async () => {
        try {
            const [structureRes, alertsRes] = await Promise.all([
                api.get('/units/structure'),
                api.get('/emergency/active')
            ]);

            setStructure(structureRes.data);

            const activeIds = alertsRes.data
                .filter((a: any) => a.unit_id)
                .map((a: any) => a.unit_id);
            setAlertUnits(new Set(activeIds));

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructure();

        if (user?.complex_id) {
            const socket = getSocket();
            joinComplexRoom(user.complex_id);

            socket.on('emergency_alert', (alert: any) => {
                if (alert.unitId) {
                    setAlertUnits(prev => new Set([...Array.from(prev), alert.unitId]));
                }
            });

            socket.on('emergency_resolved', (data: any) => {
                if (data.unitId) {
                    setAlertUnits(prev => {
                        const next = new Set(prev);
                        next.delete(data.unitId);
                        return next;
                    });
                }
            });

            return () => {
                socket.off('emergency_alert');
                socket.off('emergency_resolved');
            };
        }
    }, [user]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Generando maqueta 3D...</p>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col -m-6 relative overflow-hidden bg-slate-100">
            {/* 3D Scene Container */}
            <div className="flex-1 w-full h-full relative">
                <BuildingExplorer3D
                    structure={structure}
                    onSelectUnit={(unit) => setSelectedUnit(unit)}
                    alertUnits={alertUnits}
                />

                {/* Global Stats Panel (visible only when no unit is selected) */}
                {!selectedUnit && !loading && (
                    <div className="absolute top-6 left-6 z-10 w-72 animate-in fade-in slide-in-from-left duration-300">
                        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-none overflow-hidden">
                            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <BuildingIcon size={16} className="text-indigo-400" />
                                    Resumen del Complejo
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Home size={16} />
                                        <span className="text-sm font-medium">Total Unidades</span>
                                    </div>
                                    <span className="text-lg font-bold text-slate-900">
                                        {Object.values(structure).flat().length}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Percent size={16} />
                                        <span className="text-sm font-medium">Ocupación</span>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-600">
                                        {Math.round((Object.values(structure).flat().filter(u => u.residents?.length > 0).length / Object.values(structure).flat().length) * 100 || 0)}%
                                    </span>
                                </div>

                                <div className={clsx(
                                    "flex justify-between items-center p-3 rounded-lg border transition-all",
                                    alertUnits.size > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                                )}>
                                    <div className={clsx(
                                        "flex items-center gap-2",
                                        alertUnits.size > 0 ? "text-red-600" : "text-emerald-600"
                                    )}>
                                        <AlertTriangle size={16} className={alertUnits.size > 0 ? "animate-pulse" : ""} />
                                        <span className="text-sm font-medium">Alertas S.O.S</span>
                                    </div>
                                    <span className={clsx(
                                        "text-lg font-bold",
                                        alertUnits.size > 0 ? "text-red-700" : "text-emerald-700"
                                    )}>
                                        {alertUnits.size}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}


                {/* Detail Side Panel */}
                {selectedUnit && (
                    <div className="absolute top-6 right-6 bottom-6 w-80 z-10">
                        <Card className="h-full bg-white shadow-2xl border-none flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Apt {selectedUnit.number}</h2>
                                    <p className="text-xs text-slate-500">Piso {selectedUnit.floor}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Occupancy Status */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Estado</label>
                                    {selectedUnit.residents?.length > 0 ? (
                                        <Badge variant="success" className="px-3 py-1">Ocupado</Badge>
                                    ) : (
                                        <Badge variant="default" className="px-3 py-1">Disponible</Badge>
                                    )}
                                </div>

                                {/* Residents Info */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Residentes</label>
                                    {selectedUnit.residents?.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedUnit.residents.map((r: any) => (
                                                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                        <Users size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">{r.user?.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 capitalize">{r.type}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No hay residentes registrados.</p>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-2 pt-4">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9">
                                        <Home size={14} className="mr-2" /> Ir a Facturación
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-xs h-9 font-normal text-slate-500">
                                        Editar Unidad
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-b-lg border-t">
                                <Button className="w-full shadow-lg shadow-primary-500/20">
                                    Ver Perfil Completo
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};
