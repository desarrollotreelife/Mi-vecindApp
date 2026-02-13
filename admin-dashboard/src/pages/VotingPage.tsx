import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const VotingPage: React.FC = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

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
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Crear</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {sessions.map(session => (
                    <Card key={session.id} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold">{session.title}</h3>
                                <p className="text-sm text-slate-500">{new Date(session.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={session.status === 'open' ? 'success' : session.status === 'draft' ? 'warning' : 'default'}>
                                {session.status === 'open' ? 'Abierta' : session.status === 'draft' ? 'Borrador' : 'Cerrada'}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {session.topics.map((topic: any) => (
                                <div key={topic.id} className="bg-slate-50 p-4 rounded-lg">
                                    <p className="font-medium mb-3">{topic.question}</p>

                                    {/* Results visualization or Voting options */}
                                    {session.status === 'open' && user?.role?.name !== 'admin' ? (
                                        <div className="flex gap-2">
                                            {JSON.parse(topic.options).map((opt: string) => (
                                                <Button
                                                    key={opt}
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleVote(topic.id, opt)}
                                                >
                                                    {opt}
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Calculate results on the fly for demo */}
                                            {JSON.parse(topic.options).map((opt: string) => {
                                                const totalCoef = topic.votes.reduce((acc: number, v: any) => acc + Number(v.coefficient), 0);
                                                const optCoef = topic.votes
                                                    .filter((v: any) => v.choice === opt)
                                                    .reduce((acc: number, v: any) => acc + Number(v.coefficient), 0);
                                                const percent = totalCoef > 0 ? (optCoef / totalCoef) * 100 : 0;

                                                return (
                                                    <div key={opt} className="text-sm">
                                                        <div className="flex justify-between mb-1">
                                                            <span>{opt}</span>
                                                            <span className="font-mono">{percent.toFixed(2)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-600"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <p className="text-xs text-right text-slate-400 mt-2">
                                                Total Votos: {topic.votes.length}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {user?.role?.name === 'admin' && (
                            <div className="mt-4 pt-4 border-t flex justify-end">
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
