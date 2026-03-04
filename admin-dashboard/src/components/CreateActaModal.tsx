import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import api from '../services/api';

interface CreateActaModalProps {
    folderId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateActaModal: React.FC<CreateActaModalProps> = ({ folderId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/documents/export-pdf', {
                title,
                content,
                folderId
            });
            onSuccess();
        } catch (error) {
            alert('Error al exportar PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                            <FilePlus2Icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Redactar Acta Digital</h3>
                            <p className="text-xs text-slate-500">Se guardará automáticamente en formato PDF</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors font-medium">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="space-y-4">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Título del documento (ej: Acta de Asamblea 2026)"
                            className="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-300 dark:bg-transparent dark:text-white"
                        />
                        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
                    </div>

                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Empieza a redactar aquí... utiliza un formato claro para los puntos tratados, compromisos y firmas."
                            className="w-full h-full min-h-[500px] border-none focus:ring-0 resize-none text-slate-700 dark:text-slate-300 dark:bg-transparent leading-relaxed"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        Descartar
                    </button>
                    <button
                        disabled={loading || !title || !content}
                        onClick={handleExport}
                        className="bg-primary-600 text-on-primary px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Generando PDF...' : (
                            <>
                                <Download size={18} />
                                Generar y Guardar PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FilePlus2Icon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
)
