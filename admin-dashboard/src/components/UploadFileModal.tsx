import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface UploadFileModalProps {
    folderId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({ folderId, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            // Simulated upload / DataURL for local demo or real multipart
            const reader = new FileReader();
            reader.onloadend = async () => {
                const fileType = file.type.split('/')[0]; // image, video, application -> pdf check
                const type = file.type.includes('pdf') ? 'pdf' : (fileType === 'application' ? 'document' : fileType);

                await api.post(`/documents/folders/${folderId}/files`, {
                    name: file.name,
                    file_url: reader.result as string, // Real app: upload to S3/Firebase
                    file_type: type,
                    file_size: file.size
                });

                setStatus('success');
                setTimeout(() => onSuccess(), 1000);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Subir Archivo Multimedia</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <label className={clsx(
                        "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                        file ? "border-primary-500 bg-primary-50/50" : "border-slate-200 hover:border-primary-400 hover:bg-slate-50"
                    )}>
                        <div className={clsx(
                            "p-4 rounded-full",
                            file ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400"
                        )}>
                            <Upload size={32} />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-700 dark:text-slate-300">{file ? file.name : 'Selecciona un archivo'}</p>
                            <p className="text-xs text-slate-500 mt-1">Soporta PDF, Videos MP4, Fotos y Documentos</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>

                    {status === 'success' && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm font-medium">
                            <CheckCircle2 size={18} />
                            Archivo subido con éxito
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">
                            <AlertCircle size={18} />
                            Error al subir el archivo
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <button
                        disabled={!file || loading}
                        onClick={handleUpload}
                        className="w-full bg-primary-600 text-on-primary py-3 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Subiendo...' : 'Iniciar Carga'}
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-slate-500 text-sm font-bold">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

import clsx from 'clsx';
