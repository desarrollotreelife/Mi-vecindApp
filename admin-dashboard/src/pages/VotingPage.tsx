import React, { useState, useEffect } from 'react';
import { Plus, Users, CheckSquare, Square, BarChart2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const VotingPage: React.FC = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Attendance modal state
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [residents, setResidents] = useState<any[]>([]);
    const [attendanceList, setAttendanceList] = useState<any[]>([]);

    // New Session Form
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        type: 'assembly',
        topics: [{ question: '', options: ['A favor', 'En contra', 'Abstención'] }]
    });

    const fetchSessions = async () => {
        try {
            const response = await api.get('/voting');
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchAttendanceData = async (sessionId: number) => {
        try {
            const [resResidents, resAttendance] = await Promise.all([
                api.get('/residents'),
                api.get(`/voting/${sessionId}/attendance`)
            ]);
            setResidents(resResidents.data);
            setAttendanceList(resAttendance.data);
        } catch (error) {
            console.error('Error fetching attendance data', error);
        }
    };

    const handleOpenAttendance = (sessionId: number) => {
        setCurrentSessionId(sessionId);
        setIsAttendanceOpen(true);
        fetchAttendanceData(sessionId);
    };

    const toggleAttendance = async (residentId: number, isAttending: boolean) => {
        if (!currentSessionId) return;
        try {
            if (isAttending) {
                await api.delete(`/voting/${currentSessionId}/attendance/${residentId}`);
            } else {
                await api.post(`/voting/${currentSessionId}/attendance`, { residentId });
            }
            // Refresh list
            const resAttendance = await api.get(`/voting/${currentSessionId}/attendance`);
            setAttendanceList(resAttendance.data);
        } catch (error) {
            console.error('Error toggling attendance', error);
        }
    };

    const handleVote = async (topicId: number, choice: string) => {
        try {
            await api.post('/voting/vote', { topicId, choice });
            alert('Voto registrado exitosamente (Ponderado por Coeficiente)');
            fetchSessions();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al votar');
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/voting', formData);
            setIsFormOpen(false);
            fetchSessions();
        } catch (error) {
            alert('Error creating session');
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'open' ? 'closed' : 'open';
            await api.patch(`/voting/${id}/status`, { status: newStatus });
            fetchSessions();
        } catch (error) {
            alert('Error updating status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Votaciones</h1>
                    <p className="text-slate-500">Decisiones Democráticas (Coeficiente Ley 675)</p>
                </div>
                {user?.role?.name === 'admin' && (
                    <Button icon={Plus} onClick={() => setIsFormOpen(true)}>Nueva Votación</Button>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Crear Votación</h2>
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Pregunta Principal</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData.topics[0].question}
                                    onChange={e => {
                                        const newTopics = [...formData.topics];
                                        newTopics[0].question = e.target.value;
                                        setFormData({ ...formData, topics: newTopics });
                                    }}
                                    required
                                    placeholder="Ej: ¿Aprobar el presupuesto 2026?"
                                />
                            </div>

                            {/* Dynamic Options Editor */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Opciones de Respuesta</label>
                                <div className="space-y-2 mb-2">
                                    {formData.topics[0].options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                className="flex-1 border rounded p-2 text-sm"
                                                value={opt}
                                                onChange={e => {
                                                    const newTopics = [...formData.topics];
                                                    newTopics[0].options[idx] = e.target.value;
                                                    setFormData({ ...formData, topics: newTopics });
                                                }}
                                                required
                                            />
                                            {formData.topics[0].options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTopics = [...formData.topics];
                                                        newTopics[0].options.splice(idx, 1);
                                                        setFormData({ ...formData, topics: newTopics });
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    icon={Plus}
                                    onClick={() => {
                                        const newTopics = [...formData.topics];
                                        newTopics[0].options.push(`Opción ${newTopics[0].options.length + 1}`);
                                        setFormData({ ...formData, topics: newTopics });
                                    }}
                                >
                                    Agregar Opción
                                </Button>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Crear</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAttendanceOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> Gestionar Asistencia</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsAttendanceOpen(false)}>Cerrar</Button>
                        </div>

                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar residente por nombre o apartamento..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onChange={(e) => {
                                        const searchTerm = e.target.value.toLowerCase();
                                        const filteredRows = document.querySelectorAll('.resident-row');
                                        filteredRows.forEach((row: any) => {
                                            const text = row.textContent?.toLowerCase() || '';
                                            if (text.includes(searchTerm)) {
                                                row.style.display = 'flex';
                                            } else {
                                                row.style.display = 'none';
                                            }
                                        });
                                    }}
                                />
                                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {residents.map((resident: any) => {
                                const isAttending = attendanceList.some(a => a.resident_id === resident.id);
                                // Fallback handling just in case the backend returns raw nested unit instead of the flattened view
                                const displayApto = resident.unit_number || resident.unit?.number || 'Sin asignar';
                                const displayCoef = resident.unit?.coefficient || 0;

                                return (
                                    <div key={resident.id} className="resident-row flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-800">{resident.full_name || resident.user?.full_name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                <Badge variant="default" className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200">Apto: {displayApto}</Badge>
                                                <span>Coef: {Number(displayCoef).toFixed(2)}%</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAttendance(resident.id, isAttending)}
                                            className={`p-2 rounded-lg flex items-center gap-2 transition-all font-bold text-sm ${isAttending ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                        >
                                            {isAttending ? <CheckSquare size={18} /> : <Square size={18} />}
                                            {isAttending ? 'Presente' : 'Ausente'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {sessions.map(session => (
                    <Card key={session.id} className="flex flex-col">
                        <div className="p-6 pb-2 border-b">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold">{session.title}</h3>
                                    <p className="text-sm text-slate-500">{new Date(session.created_at).toLocaleDateString()}</p>
                                </div>
                                <Badge variant={session.status === 'open' ? 'success' : session.status === 'draft' ? 'warning' : 'default'}>
                                    {session.status === 'open' ? 'Abierta' : session.status === 'draft' ? 'Borrador' : 'Cerrada'}
                                </Badge>
                            </div>
                        </div>

                        <div className="p-6 flex-1 space-y-6">
                            {session.topics.map((topic: any) => (
                                <div key={topic.id} className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <p className="font-bold text-slate-800 mb-4 text-base">{topic.question}</p>

                                    {session.status === 'open' && user?.role?.name !== 'admin' ? (
                                        <div className="flex flex-wrap gap-2">
                                            {JSON.parse(topic.options).map((opt: string) => (
                                                <Button
                                                    key={opt}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 min-w-[100px] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                                                    onClick={() => handleVote(topic.id, opt)}
                                                >
                                                    {opt}
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {JSON.parse(topic.options).map((opt: string) => {
                                                const totalCoef = topic.votes.reduce((acc: number, v: any) => acc + (Number(v.coefficient) || 1), 0);
                                                const optCoef = topic.votes
                                                    .filter((v: any) => v.choice === opt)
                                                    .reduce((acc: number, v: any) => acc + (Number(v.coefficient) || 1), 0);
                                                const percent = totalCoef > 0 ? (optCoef / totalCoef) * 100 : 0;

                                                return (
                                                    <div key={opt} className="relative">
                                                        <div className="flex justify-between mb-1.5 text-sm">
                                                            <span className="font-bold text-slate-700">{opt}</span>
                                                            <div className="text-right">
                                                                <span className="font-mono font-bold text-indigo-700">{percent.toFixed(1)}%</span>
                                                                <span className="text-xs text-slate-500 ml-2">({topic.votes.filter((v: any) => v.choice === opt).length} votos)</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <BarChart2 size={14} /> Total Votos Emitidos
                                                </div>
                                                <span>{topic.votes.length}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {user?.role?.name === 'admin' && (
                            <div className="p-4 bg-slate-50 border-t flex flex-wrap justify-end gap-2 rounded-b-xl">
                                {(session.status === 'draft' || session.status === 'open') && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        icon={Users}
                                        onClick={() => handleOpenAttendance(session.id)}
                                    >
                                        Gestionar Asistencia
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleStatus(session.id, session.status)}
                                >
                                    {session.status === 'open' ? 'Cerrar Votación' : session.status === 'draft' ? 'Abrir Votación' : 'Reabrir Votación'}
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};
