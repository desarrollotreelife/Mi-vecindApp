import React, { useState, useEffect } from 'react';
import { Settings, Save, X, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ModuleConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    complex: any;
    onSuccess: () => void;
}

const AVAILABLE_MODULES = [
    { id: 'dashboard', name: 'Dashboard Principal', description: 'Vista general y estadísticas base', required: true },
    { id: 'residents', name: 'Gestión de Residentes', description: 'Perfiles, vehículos y unidades', required: true },
    { id: 'finance', name: 'Finanzas y Pagos', description: 'Cartera, recibos de caja y egresos' },
    { id: 'visits', name: 'Control de Visitas', description: 'Registro de ingresos y códigos QR' },
    { id: 'parking', name: 'Gestión de Parqueaderos', description: 'Asignación y mapa 3D de celdas' },
    { id: 'store', name: 'Tienda Interna (POS)', description: 'Venta de productos e inventarios' },
    { id: 'maintenance', name: 'Mantenimiento y Activos', description: 'Tareas programadas e infraestructura' },
    { id: 'pqrs', name: 'PQRS y Comunicación', description: 'Peticiones, quejas y cartelera digital' },
    { id: 'voting', name: 'Votaciones Operativas', description: 'Asambleas y votos por coeficiente' },
    { id: 'amenities', name: 'Reservas de Amenidades', description: 'Zonas comunes y salones sociales' }
];

export const ModuleConfigModal: React.FC<ModuleConfigModalProps> = ({ isOpen, onClose, complex, onSuccess }) => {
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (complex?.active_modules) {
            setSelectedModules(complex.active_modules.split(','));
        } else {
            // Default modules if none set
            setSelectedModules(['dashboard', 'residents', 'visits']);
        }
    }, [complex, isOpen]);

    if (!isOpen) return null;

    const toggleModule = (id: string) => {
        const mod = AVAILABLE_MODULES.find(m => m.id === id);
        if (mod?.required) return;

        if (selectedModules.includes(id)) {
            setSelectedModules(selectedModules.filter(m => m !== id));
        } else {
            setSelectedModules([...selectedModules, id]);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const modulesString = selectedModules.join(',');
            await api.patch(`/super-admin/complexes/${complex.id}`, { active_modules: modulesString });
            toast.success('Configuración de módulos actualizada');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error al guardar configuración');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Configurar Módulos</h2>
                            <p className="text-sm text-slate-500">{complex.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modules Checklist */}
                <div className="p-6 overflow-y-auto space-y-3">
                    <p className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                        Selecciona los módulos que estarán habilitados para este conjunto residencial. Los cambios se verán reflejados al reiniciar la sesión.
                    </p>

                    {AVAILABLE_MODULES.map((mod) => (
                        <button
                            key={mod.id}
                            disabled={mod.required}
                            onClick={() => toggleModule(mod.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedModules.includes(mod.id)
                                ? 'border-primary-200 bg-primary-50/30'
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                } ${mod.required ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                        >
                            <div className={`shrink-0 ${selectedModules.includes(mod.id) ? 'text-primary-600' : 'text-slate-300'}`}>
                                {selectedModules.includes(mod.id) ? <CheckCircle2 size={24} className="text-primary-600" /> : <Circle size={24} />}
                            </div>
                            <div className="flex-1">
                                <span className={`block font-bold ${selectedModules.includes(mod.id) ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {mod.name}
                                    {mod.required && <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Obligatorio</span>}
                                </span>
                                <span className="text-xs text-slate-500 leading-relaxed font-medium">{mod.description}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button icon={Save} isLoading={isLoading} onClick={handleSave}>Guardar Suscripción</Button>
                </div>
            </div>
        </div>
    );
};
