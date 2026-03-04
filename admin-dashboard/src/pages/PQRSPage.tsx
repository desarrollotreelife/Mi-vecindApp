import React, { useState, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PQRSPage: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // New Request Form State
    const [formData, setFormData] = useState({
        type: 'petition',
        subject: '',
        description: ''
    });

    const fetchRequests = async () => {
        try {
            const response = await api.get('/pqrs');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching PQRS:', error);
        } finally {
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/pqrs', formData);
            setIsFormOpen(false);
            setFormData({ type: 'petition', subject: '', description: '' });
            fetchRequests();
            alert('Solicitud radicada correctamente.');
        } catch (error) {
            alert('Error al radicar solicitud.');
        }
    };

    const handleRespond = async (id: number) => {
        const response = prompt('Ingrese la respuesta formal:');
        if (!response) return;

        try {
            await api.patch(`/pqrs/${id}/respond`, { response });
            fetchRequests();
        } catch (error) {
            alert('Error al responder.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">PQRS</h1>
                    <p className="text-slate-500">Peticiones, Quejas, Reclamos y Sugerencias (Ley 675)</p>
                </div>
                <Button icon={Plus} onClick={() => setIsFormOpen(true)}>Nueva Solicitud</Button>
            </div>

            {/* Form Modal (Simple inline for now) */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Radicar PQRS</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="petition">Derecho de Petición</option>
                                    <option value="complaint">Queja (Conducta)</option>
                                    <option value="claim">Reclamo (Servicio/Bien)</option>
                                    <option value="suggestion">Sugerencia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Asunto</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Resumen de la solicitud"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción Detallada</label>
                                <textarea
                                    required
                                    className="w-full border rounded p-2 h-32"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describa los hechos o la solicitud..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit" icon={Send}>Radicar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                    data={requests}
                    columns={[
                        {
                            header: 'Radicado',
                            render: (_, item) => <span className="font-mono text-xs">#{item.id}</span>
                        },
                        {
                            header: 'Fecha',
                            render: (_, item) => new Date(item.created_at).toLocaleDateString()
                        },
                        {
                            header: 'Tipo',
                            render: (_, item) => (
                                <Badge variant="info">
                                    {item.type === 'petition' ? 'Petición' :
                                        item.type === 'complaint' ? 'Queja' :
                                            item.type === 'claim' ? 'Reclamo' : 'Sugerencia'}
                                </Badge>
                            )
                        },
                        { header: 'Asunto', accessor: 'subject' },
                        {
                            header: 'Residente',
                            render: (_, item) => (
                                <div className="text-sm">
                                    <div className="font-medium">{item.user?.full_name}</div>
                                    <div className="text-xs text-slate-500">{item.user?.document_num}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Estado',
                            render: (_, item) => (
                                <Badge variant={item.status === 'open' ? 'warning' : 'success'}>
                                    {item.status === 'open' ? 'Abierto' : 'Cerrado/Respondido'}
                                </Badge>
                            )
                        },
                        {
                            header: 'Respuesta',
                            render: (_, item) => item.response ? (
                                <div className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded max-w-xs">
                                    "{item.response}"
                                </div>
                            ) : <span className="text-slate-400 text-xs text-center block">-</span>
                        }
                    ]}
                    actions={(item) => user?.role?.name === 'admin' && item.status === 'open' && (
                        <Button size="sm" onClick={() => handleRespond(item.id)}>Responder</Button>
                    )}
                />
            </div>
        </div>
    );
};
