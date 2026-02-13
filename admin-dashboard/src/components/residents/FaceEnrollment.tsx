import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { faceService } from '../../services/FaceService';
import { Camera, RefreshCw, AlertCircle, ScanFace, Sun, CheckCircle2 } from 'lucide-react';

interface FaceEnrollmentProps {
    onCapture: (descriptor: Float32Array, imageSrc: string) => void;
    onCancel?: () => void;
}

export const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ onCapture, onCancel }) => {
    const webcamRef = useRef<Webcam>(null);
    const [loading, setLoading] = useState(true);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lightingStatus, setLightingStatus] = useState<'ok' | 'dark' | 'bright'>('ok');

    // Load Models
    useEffect(() => {
        const init = async () => {
            try {
                await faceService.loadModels();
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Error cargando modelos de IA. Verifique su conexión.');
                setLoading(false);
            }
        };
        init();
    }, []);

    // Lighting Check Loop
    useEffect(() => {
        if (loading || !webcamRef.current?.video) return;

        const checkLighting = () => {
            const video = webcamRef.current?.video;
            if (!video || video.readyState !== 4 || video.videoWidth === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, 100, 100);
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;

            let total = 0;
            for (let i = 0; i < data.length; i += 4) {
                total += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            const brightness = total / (data.length / 4);

            if (brightness < 60) setLightingStatus('dark');
            else if (brightness > 230) setLightingStatus('bright');
            else setLightingStatus('ok');
        };

        const interval = setInterval(checkLighting, 1000);
        return () => clearInterval(interval);
    }, [loading]);

    const capture = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setDetecting(true);
        setError(null);

        try {
            // Create an HTMLImageElement from the screenshot
            const img = new Image();
            img.src = imageSrc;
            await new Promise((resolve) => (img.onload = resolve));

            if (img.width === 0 || img.height === 0) {
                throw new Error("La imagen capturada está vacía o corrupta.");
            }

            // Detect face
            const descriptor = await faceService.getFaceDescriptor(img);

            if (descriptor) {
                console.log("Rostro detectado correctamente");
                onCapture(descriptor, imageSrc);
            } else {
                setError('No se detectó ningún rostro. Asegúrese de tener buena iluminación y mirar a la cámara.');
            }
        } catch (err: any) {
            console.error("Error en detección facial:", err);
            const msg = err.message || err.toString();
            if (msg.includes('backend')) {
                setError('Error de WebGL/Gráficos. Intente en otro navegador.');
            } else {
                setError(`Error técnico: ${msg}`);
            }
        } finally {
            setDetecting(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <ScanFace className="text-blue-600" />
                Registro Biométrico
            </h3>
            <p className="text-slate-500 text-sm mb-6 text-center">
                Mire directamente a la cámara. Asegúrese de tener buena iluminación.
            </p>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <RefreshCw className="animate-spin text-blue-500 mb-2" size={32} />
                    <span className="text-slate-400 font-medium">Cargando IA...</span>
                </div>
            ) : (
                <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 group ring-4 ring-slate-100">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                        videoConstraints={{ facingMode: "user" }}
                    />

                    {/* Professional overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Scanning Grid */}
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                        {/* Corners */}
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                        {/* Scanning Laser */}
                        <div className="absolute left-0 right-0 h-1 bg-blue-400/80 shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>

                        {/* Central Reticle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-blue-400/30 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border-t border-l border-blue-200 absolute top-10 left-10"></div>
                            <div className="w-4 h-4 border-t border-r border-blue-200 absolute top-10 right-10"></div>
                            <span className="text-[10px] text-blue-300 font-mono mt-32 bg-black/40 px-2 rounded">FACE_DETECT</span>
                        </div>
                    </div>

                    {/* Status Feedback */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {lightingStatus === 'dark' && (
                            <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-pulse">
                                <Sun size={18} />
                                ILUMINACIÓN BAJA
                            </div>
                        )}
                        {lightingStatus === 'bright' && (
                            <div className="bg-yellow-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                                <Sun size={18} />
                                DEMASIADA LUZ
                            </div>
                        )}
                        {lightingStatus === 'ok' && !detecting && (
                            <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                                <CheckCircle2 size={18} />
                                CONDICIONES ÓPTIMAS
                            </div>
                        )}
                    </div>

                    {detecting && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="font-bold text-lg tracking-widest">ANALIZANDO...</span>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl w-full mb-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <AlertCircle className="shrink-0" size={24} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex gap-4 w-full">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium border border-transparent hover:border-slate-200"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={capture}
                    disabled={detecting || lightingStatus === 'dark'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-200 font-bold"
                >
                    <Camera size={20} />
                    Capturar
                </button>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};
