import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldAlert, KeyRound } from 'lucide-react';

interface SecurityCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (code: string) => void;
    title?: string;
    message?: string;
    isDeleting?: boolean;
}

export const SecurityCodeModal: React.FC<SecurityCodeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmación de Seguridad",
    message = "Esta acción es permanente. Por favor ingresa el código de seguridad de tu conjunto.",
    isDeleting = false
}) => {
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 shadow-2xl border-indigo-100">
                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <ShieldAlert size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                </div>

                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    {message}
                </p>

                <div className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <KeyRound size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="Introduce el código..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none text-center text-xl tracking-widest font-mono"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1 py-3"
                            onClick={() => {
                                setCode('');
                                onClose();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className={`flex-1 py-3 ${isDeleting ? 'bg-red-600 hover:bg-red-700' : ''}`}
                            disabled={!code}
                            onClick={() => {
                                onConfirm(code);
                                setCode('');
                            }}
                        >
                            {isDeleting ? 'Confirmar Borrado' : 'Confirmar'}
                        </Button>
                    </div>
                </div>

                <p className="mt-4 text-center text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                    Suministrado por Super Administrador
                </p>
            </Card>
        </div>
    );
};
