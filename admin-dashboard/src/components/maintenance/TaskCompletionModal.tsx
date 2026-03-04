import React, { useState } from 'react';
import { X, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface TaskCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    task: any;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ isOpen, onClose, onSuccess, task }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        completed_date: new Date().toISOString().split('T')[0],
        cost: 0,
        technical_report: '',
        photos: ''
    });

    if (!isOpen || !task) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.patch(`/maintenance/tasks/${task.id}/complete`, formData);
            toast.success('Tarea completada y egreso generado');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error al completar tarea');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                        <CheckCircle size={20} className="text-emerald-600" />
                        <h2 className="text-lg font-bold">Completar Tarea</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                        <h3 className="font-bold text-blue-900 text-sm">{task.title}</h3>
                        <p className="text-xs text-blue-700">{task.item?.name}</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Finalización</label>
                        <input
                            type="date"
                            className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.completed_date}
                            onChange={e => setFormData({ ...formData, completed_date: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Costo Total ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="number"
                                className="w-full pl-10 pr-4 py-2.5 mt-1 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="0"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Este valor se registrará automáticamente como un egreso en Finanzas.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Informe Técnico / Observaciones</label>
                        <textarea
                            className="w-full mt-1 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[100px]"
                            placeholder="Describe el trabajo realizado..."
                            value={formData.technical_report}
                            onChange={e => setFormData({ ...formData, technical_report: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                        <Button icon={CheckCircle} isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white" type="submit">Finalizar Tarea</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
