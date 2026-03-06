import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RegistrationRequest {
    id: number;
    full_name: string;
    document_num: string;
    email: string;
    phone: string;
    unit_id: number;
    unit: { block?: string; number: string };
    requested_role: string;
    status: string;
    created_at: string;
}

export const RegistrationRequestsList: React.FC<{ status: 'pending' | 'rejected' }> = ({ status }) => {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/residents/requests?status=${status}`);
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching registration requests:', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [status]);

    const handleApprove = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas aprobar este usuario y darle acceso a la plataforma?')) return;
        try {
            await api.post(`/residents/requests/${id}/approve`);
            toast.success('Solicitud aprobada correctamente');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al aprobar solicitud');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas rechazar este registro?')) return;
        try {
            await api.post(`/residents/requests/${id}/reject`);
            toast.success('Solicitud rechazada');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al rechazar solicitud');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar definitivamente este registro rechazado?')) return;
        try {
            await api.delete(`/residents/requests/${id}`);
            toast.success('Registro eliminado');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar');
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-500">Cargando solicitudes...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-700">No hay solicitudes</h3>
                <p className="text-slate-500 text-sm mt-1">
                    {status === 'pending' ? 'No tienes nuevas solicitudes de registro pendientes de revisión.' : 'No hay solicitudes rechazadas en el historial.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">{req.full_name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">C.C. {req.document_num}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {req.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                        </span>
                    </div>

                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Unidad/Apto:</span>
                            <span className="font-medium text-slate-700">{req.unit?.block ? `${req.unit.block} - ${req.unit.number}` : req.unit?.number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Rol Solicitado:</span>
                            <span className="font-medium text-slate-700 capitalize">{req.requested_role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Teléfono:</span>
                            <span className="font-medium text-slate-700">{req.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Correo:</span>
                            <span className="font-medium text-slate-700 truncate max-w-[140px]" title={req.email}>{req.email}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 pt-4">
                        {status === 'pending' ? (
                            <>
                                <button
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <XCircle size={16} /> Rechazar
                                </button>
                                <button
                                    onClick={() => handleApprove(req.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm shadow-green-500/20"
                                >
                                    <CheckCircle size={16} /> Aprobar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleDelete(req.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} /> Eliminar Definitivamente
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
