import React, { useState, useEffect } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export const DocumentsPage: React.FC = () => {
    const [docs, setDocs] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        type: 'assembly',
        date: new Date().toISOString().split('T')[0],
        description: '',
        file: ''
    });

    const fetchDocs = async () => {
        try {
            const response = await api.get('/documents');
            setDocs(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, file: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/documents', formData);
            setIsFormOpen(false);
            setFormData({ title: '', type: 'assembly', date: new Date().toISOString().split('T')[0], description: '', file: '' });
            fetchDocs();
        } catch (error) {
            alert('Error al subir documento.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Actas y Documentos</h1>
                    <p className="text-slate-500">Historial de Asambleas y Consejos (Ley 675)</p>
                </div>
                <Button icon={Upload} onClick={() => setIsFormOpen(true)}>Subir Acta</Button>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Subir Documento</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej. Acta de Asamblea Ordinaria 2024"
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
                                        <option value="assembly">Asamblea</option>
                                        <option value="council">Conejo de Admon</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded p-2"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Archivo (PDF)</label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="w-full border rounded p-2"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Subir</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                    data={docs}
                    columns={[
                        {
                            header: 'Fecha',
                            render: (_, item) => new Date(item.date).toLocaleDateString()
                        },
                        {
                            header: 'Tipo',
                            render: (_, item) => (
                                <Badge variant={item.type === 'assembly' ? 'success' : 'info'}>
                                    {item.type === 'assembly' ? 'Asamblea' : 'Consejo'}
                                </Badge>
                            )
                        },
                        { header: 'Título', accessor: 'title' },
                        {
                            header: 'Archivo',
                            render: (_, item) => (
                                <a
                                    href={item.file_url.startsWith('http') ? item.file_url : `http://localhost:3001${item.file_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary-600 hover:underline flex items-center gap-1"
                                >
                                    <FileText size={16} /> Ver PDF
                                </a>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
};
