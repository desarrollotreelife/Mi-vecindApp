import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, AlertCircle, Vote, Info, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ResidentVotingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingError, setVotingError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/voting');
            const openSessions = res.data.filter((s: any) => s.status === 'open');
            setSessions(openSessions);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setVotingError('No se pudo conectar con el servidor de votaciones.');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (topicId: number, choice: string) => {
        setVotingError(null);
        setSuccessMsg(null);
        try {
            await api.post('/voting/vote', { topicId, choice });
            setSuccessMsg('¡Voto registrado exitosamente! Su decisión ha sido contabilizada de acuerdo a su coeficiente.');
            fetchSessions();
        } catch (error: any) {
            console.error('Vote Error:', error);
            setVotingError(error.response?.data?.error || 'No se pudo registrar su voto. Asegúrese de que la asamblea esté activa y usted haya marcado asistencia.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/resident/home')}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black font-outfit">Asamblea Virtual</h1>
                        <p className="text-indigo-100 text-sm font-medium">Decisiones de su conjunto</p>
                    </div>
                </div>
                <Vote className="absolute -right-8 -bottom-8 text-white/10" size={160} />
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Notifications */}
                <AnimatePresence>
                    {votingError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
                        >
                            <AlertCircle className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium leading-relaxed">{votingError}</p>
                        </motion.div>
                    )}
                    {successMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
                        >
                            <CheckCircle2 className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium leading-relaxed">{successMsg}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {sessions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info size={32} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Sin asambleas activas</h2>
                        <p className="text-slate-500 text-sm">No hay votaciones abiertas en este momento. La administración notificará cuando inicie una nueva asamblea.</p>
                        <button
                            onClick={() => navigate('/resident/home')}
                            className="mt-6 text-indigo-600 font-bold text-sm bg-indigo-50 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                ) : (
                    sessions.map((session: any) => (
                        <div key={session.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
                            <div className="border-b border-slate-100 pb-4 mb-4">
                                <h2 className="text-xl font-bold text-slate-900">{session.title}</h2>
                                <p className="text-sm text-slate-500 mt-1">Iniciada: {new Date(session.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="space-y-6">
                                {session.topics.map((topic: any, index: number) => (
                                    <div key={topic.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                                {index + 1}
                                            </div>
                                            <p className="font-bold text-slate-800">{topic.question}</p>
                                        </div>

                                        {(() => {
                                            const userVotes = topic.votes?.filter((v: any) => Number(v.user_id) === Number(user?.id));
                                            const hasVoted = userVotes && userVotes.length > 0;

                                            if (hasVoted || session.status === 'closed') {
                                                const totalCoef = topic.votes?.reduce((acc: number, v: any) => acc + (Number(v.coefficient) || 1), 0) || 0;
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg w-max">
                                                            <CheckCircle2 size={16} /> Usted ya registró su voto
                                                        </div>
                                                        {JSON.parse(topic.options).map((opt: string) => {
                                                            const optCoef = topic.votes
                                                                ?.filter((v: any) => v.choice === opt)
                                                                .reduce((acc: number, v: any) => acc + (Number(v.coefficient) || 1), 0) || 0;
                                                            const percent = totalCoef > 0 ? (optCoef / totalCoef) * 100 : 0;

                                                            return (
                                                                <div key={opt} className="relative">
                                                                    <div className="flex justify-between mb-1.5 text-sm">
                                                                        <span className="font-bold text-slate-700">{opt}</span>
                                                                        <div className="text-right">
                                                                            <span className="font-mono font-bold text-indigo-700">{percent.toFixed(1)}%</span>
                                                                            <span className="text-xs text-slate-500 ml-2">({topic.votes?.filter((v: any) => v.choice === opt).length} votos)</span>
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
                                                            <span>{topic.votes?.length || 0}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {JSON.parse(topic.options).map((opt: string) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => handleVote(topic.id, opt)}
                                                            className="bg-white border-2 border-slate-200 py-3 px-4 rounded-xl text-slate-700 font-bold hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 text-center shadow-sm"
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
