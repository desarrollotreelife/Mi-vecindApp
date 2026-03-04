import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, ShieldCheck, ShieldAlert, X, User, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

interface VCardScannerProps {
    onClose: () => void;
}

export const VCardScanner: React.FC<VCardScannerProps> = ({ onClose }) => {
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                requestAnimationFrame(scanQR);
            }
        } catch (err) {
            setError('No se pudo acceder a la cámara');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };

    const scanQR = () => {
        if (!scanning || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                handleVerify(code.data);
                return; // Stop scanning after find
            }
        }
        requestAnimationFrame(scanQR);
    };

    const handleVerify = async (token: string) => {
        setScanning(false);
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/residents/vcard/verify', { token });
            setResult(res.data);

            // Audio Feedback
            const msg = new SpeechSynthesisUtterance("Identidad verificada. " + res.data.name);
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al verificar QR');
            // Audio Feedback Error
            const msg = new SpeechSynthesisUtterance("Error. Código inválido o expirado.");
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
        setScanning(true);
        requestAnimationFrame(scanQR);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <Camera className="text-blue-400" size={20} />
                        </div>
                        <h2 className="font-outfit font-black text-xl tracking-tight uppercase italic">Verificador V-Card</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {scanning && (
                        <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner">
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
                            <canvas ref={canvasRef} className="hidden" />
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none" />
                            <div className="absolute inset-[60px] border-2 border-blue-400 rounded-lg animate-pulse">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-1 translate-y-1" />
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <p className="text-white text-[10px] font-black tracking-widest uppercase bg-blue-600/80 px-4 py-1.5 rounded-full inline-block backdrop-blur-md">
                                    Encuadra el QR del Residente
                                </p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Verificando Token...</p>
                        </div>
                    )}

                    {!loading && result && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                            <div className="flex items-center gap-6 p-6 bg-green-50 rounded-3xl border border-green-100">
                                <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                                    {result.photo ? (
                                        <img src={result.photo} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck className="text-green-600" size={18} />
                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">VERIFICADO</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 font-outfit leading-tight">{result.name}</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1">
                                        <Home size={14} /> UNIDAD {result.unit}
                                    </p>
                                </div>
                            </div>

                            <button onClick={reset} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200">
                                ESCANEAR SIGUIENTE
                            </button>
                        </motion.div>
                    )}

                    {error && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldAlert size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-red-900 mb-2">VERIFICACIÓN FALLIDA</h3>
                            <p className="text-slate-500 font-medium mb-8">{error}</p>
                            <button onClick={reset} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
                                REINTENTAR
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
