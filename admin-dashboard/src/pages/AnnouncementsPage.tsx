import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AnnouncementsPage: React.FC = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium',
        expires_at: ''
    });

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements');
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/announcements', formData);
            setIsFormOpen(false);
            fetchAnnouncements();
        } catch (error) {
            alert('Error creating announcement');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar comunicado?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            alert('Error deleting announcement');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Comunicaciones</h1>
                    <p className="text-slate-500">Cartelera Digital y Noticias</p>
                </div>
                {user?.role?.name === 'admin' && (
                    <Button icon={Plus} onClick={() => setIsFormOpen(true)}>Nuevo Comunicado</Button>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Publicar Comunicado</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                <label className="block text-sm font-medium mb-1">Contenido</label>
                                <textarea
                                    className="w-full border rounded p-2 h-24"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <select
                                        className="w-full border rounded p-2"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="general">General</option>
                                        <option value="news">Noticia</option>
                                        <option value="alert">Alerta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prioridad</label>
                                    <select
                                        className="w-full border rounded p-2"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Publicar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {announcements.map(item => (
                    <Card key={item.id} className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant={item.priority === 'high' ? 'error' : 'info'}>
                                    {item.priority.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-slate-500">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {user?.role?.name === 'admin' && (
                                <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <Megaphone size={18} className="text-primary-600" />
                            {item.title}
                        </h3>
                        <p className="text-slate-600 whitespace-pre-wrap">{item.content}</p>
                        <div className="mt-4 text-xs text-slate-400">
                            Publicado por: {item.author.full_name}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
