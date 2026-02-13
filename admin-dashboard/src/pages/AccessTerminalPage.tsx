import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import jsQR from 'jsqr';
// import * as tf from '@tensorflow/tfjs';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { ShieldCheck, RefreshCw, Fingerprint, CreditCard, Sun, Moon, Scan, AlertTriangle } from 'lucide-react';
import { faceService } from '../services/FaceService';
import api from '../services/api';
import { CameraManager } from '../components/access/CameraManager';
import { LPRView } from '../components/access/LPRView';

import { useTheme } from '../context/ThemeContext';

export const AccessTerminalPage: React.FC = () => {
    // ... refs and states ...
    const webcamRef = useRef<Webcam>(null);
    const lastDeniedTime = useRef<number>(0);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [accessStatus, setAccessStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
    const [identifiedPerson, setIdentifiedPerson] = useState<any>(null);
    const [residents, setResidents] = useState<any[]>([]);
    const [objectModel, setObjectModel] = useState<any>(null); // COCO-SSD Model
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const { theme: globalTheme, toggleTheme } = useTheme();
    const isDarkMode = globalTheme === 'dark';

    // ... rest of code ...

    // Configuration
    const [faceCamId, setFaceCamId] = useState<string>('');
    const [lprCamId, setLprCamId] = useState<string>('');

    // UI States
    const [lastScan, setLastScan] = useState<{ type: string, value: string, time: Date } | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'granted' | 'denied'>('all');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Critical Data (Fast)
                const [residentsRes, logsRes] = await Promise.all([
                    api.get('/residents'),
                    api.get('/access/logs').catch(e => ({ data: [] }))
                ]);

                // Process Residents
                const validResidents = residentsRes.data
                    .filter((r: any) => r.biometric_descriptor)
                    .map((r: any) => ({
                        ...r,
                        descriptor: new Float32Array(JSON.parse(r.biometric_descriptor))
                    }));
                setResidents(validResidents);

                // Process Logs
                const parsedLogs = logsRes.data.map((l: any) => ({
                    ...l,
                    timestamp: new Date(l.timestamp)
                }));
                setLogs(parsedLogs);

                // Render UI immediately
                setLoading(false);

                // 2. Heavy AI Models (Background)
                console.log('Starting AI Model Loading...');
                // Load FaceAPI first as it's critical for basic auth
                await faceService.loadModels();

                // Removed cocoSsd due to TFJS version conflict crashing the init
                // const model = await cocoSsd.load();
                // setObjectModel(model);

                console.log('All AI Models Loaded');
                setModelsLoaded(true);

            } catch (err) {
                console.error('Initialization error:', err);
                setLoading(false); // Ensure UI shows at least
            }
        };
        init();
    }, []);

    // Face Recognition Loop
    // Face Recognition Logic
    const performFaceScan = async (isManual = false) => {
        if (processing || accessStatus !== 'idle' || !webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setProcessing(true);
        try {
            const img = new Image();
            img.src = imageSrc;
            await new Promise(r => img.onload = r);

            // 1. Anti-Spoofing Check (Object Detection)
            /* TEMPORARILY DISABLED (User Request: "Dejémoslo como lo tenía")
            if (objectModel) {
                const predictions = await objectModel.detect(img);
                // Check for spoofing objects: phone, book (photo), laptop, remote
                const forbiddenObjects = predictions.filter((p: any) =>
                    ['cell phone', 'remote', 'book', 'laptop', 'tablet'].includes(p.class) && p.score > 0.6
                );

                if (forbiddenObjects.length > 0) {
                    const detectedObj = forbiddenObjects[0].class;
                    console.warn('Spoofing attempt detected:', detectedObj);

                    const utterance = new SpeechSynthesisUtterance(`Alerta de seguridad. Se detectó un ${detectedObj}. Acceso denegado.`);
                    window.speechSynthesis.speak(utterance);

                    setAccessStatus('denied');
                    setIdentifiedPerson({
                        error: "INTENTO DE SUPLANTACIÓN",
                        detail: `Objeto detectado: ${detectedObj.toUpperCase()}`,
                        snapshot: imageSrc
                    });

                    // Log Security Incident
                    const newLog = {
                        id: Date.now(),
                        timestamp: new Date(),
                        method: 'face',
                        success: false,
                        name: 'Suplantación Detectada',
                        type: 'Alerta de Seguridad',
                        details: `Objeto prohibido: ${detectedObj}`,
                        snapshot_url: imageSrc
                    };
                    setLogs(prev => [newLog, ...prev]);

                    api.post('/access/log', {
                        access_point_id: 1,
                        method: 'face',
                        success: false,
                        details: `ALERTA DE SEGURIDAD - Objeto: ${detectedObj}`,
                        snapshot: imageSrc
                    }).catch(console.error);

                    setProcessing(false);
                    setTimeout(() => {
                        setAccessStatus('idle');
                        setIdentifiedPerson(null);
                    }, 4000);
                    return; // STOP HERE
                }
            }
            */

            // DEBUG
            console.log('📸 Capturing frame...');

            // QR Code Scanning
            try {
                const video = webcamRef.current?.video;
                if (video && video.readyState === 4) {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

                        if (code && code.data && code.data.startsWith('v_')) {
                            console.log('📱 QR Detected:', code.data);
                            const now = Date.now();
                            if (now - lastDeniedTime.current > 3000) {
                                lastDeniedTime.current = now; // Throttle

                                // Call backend
                                api.post('/visits/verify-qr', { token: code.data })
                                    .then(res => {
                                        if (res.data.valid) {
                                            handleAccessGranted(res.data.visitor, 'qr');
                                        } else {
                                            throw new Error('QR Inválido');
                                        }
                                    })
                                    .catch(e => {
                                        console.error('QR Validation Failed:', e);
                                        const utterance = new SpeechSynthesisUtterance("Código QR no válido");
                                        window.speechSynthesis.speak(utterance);
                                        setAccessStatus('denied');
                                        setIdentifiedPerson({ error: "QR INVÁLIDO", detail: "Código no reconocido o expirado" });
                                        setTimeout(() => {
                                            setAccessStatus('idle');
                                            setIdentifiedPerson(null);
                                        }, 3000);
                                    });
                            }
                        }
                    }
                }
            } catch (qrErr) {
                console.error('QR Scan Error:', qrErr);
            }

            const descriptor = await faceService.getFaceDescriptor(img);
            console.log('👤 Descriptor:', descriptor ? 'Found' : 'Not Found');

            if (descriptor) {
                let bestMatch = { distance: 0.6, resident: null as any }; // Threshold cap
                let realMinDistance = 1.0; // Track actual lowest distance for debug

                // console.log(`Comparing detected face with ${residents.length} residents...`);

                for (const resident of residents) {
                    try {
                        const distance = faceapi.euclideanDistance(descriptor, resident.descriptor);
                        // console.log(`Distance to ${resident.full_name}: ${distance}`);

                        if (distance < realMinDistance) {
                            realMinDistance = distance;
                        }

                        if (distance < bestMatch.distance) {
                            bestMatch = { distance, resident };
                        }
                    } catch (e) {
                        console.error(`Error comparing with resident ${resident.id}:`, e);
                    }
                }

                if (bestMatch.resident) {
                    console.log('✅ Access Granted:', bestMatch.resident.full_name);
                    handleAccessGranted(bestMatch.resident, 'face');
                } else {
                    console.log('❌ Unknown Face. Min Distance:', realMinDistance);

                    // Always show feedback for manual scans
                    if (isManual) {
                        const msg = `USUARIO NO IDENTIFICADO\nDiferencia: ${realMinDistance.toFixed(2)}`;
                        const utterance = new SpeechSynthesisUtterance("Acceso no autorizado");
                        window.speechSynthesis.speak(utterance);

                        setIdentifiedPerson({ error: "USUARIO NO IDENTIFICADO", detail: `Diferencia: ${realMinDistance.toFixed(2)}` });
                        setTimeout(() => {
                            setAccessStatus('idle');
                            setIdentifiedPerson(null);
                        }, 3000);
                    }
                    // For auto-scan, only alert if very clear face but unknown (prevent spam)
                    else if (!isManual) {
                        const now = Date.now();
                        if (now - lastDeniedTime.current > 5000 && realMinDistance < 0.8) {
                            console.log('🚨 Alerting Unauthorized Access');
                            lastDeniedTime.current = now;
                            const snapshot = webcamRef.current.getScreenshot();

                            const utterance = new SpeechSynthesisUtterance("Acceso no autorizado");
                            window.speechSynthesis.speak(utterance);

                            setAccessStatus('denied');
                            setIdentifiedPerson({
                                error: "USUARIO NO IDENTIFICADO",
                                detail: `Diferencia: ${realMinDistance.toFixed(2)}`,
                                snapshot: snapshot
                            });

                            // Log...
                            // ...
                            setTimeout(() => {
                                setAccessStatus('idle');
                                setIdentifiedPerson(null);
                            }, 3000);
                        }
                    }
                }
            } else {
                console.log('⚠️ No face detected in frame');
                if (isManual) {
                    // ... manual feedback
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    // Auto-Scan Interval
    useEffect(() => {
        if (loading || !modelsLoaded || !faceCamId) return;

        // Fast interval for real-time feel
        const interval = setInterval(() => performFaceScan(false), 200);

        return () => clearInterval(interval);
    }, [loading, modelsLoaded, residents, processing, accessStatus, faceCamId]);

    const handleAccessGranted = async (resident: any, method: string) => {
        setIdentifiedPerson(resident);
        setAccessStatus('granted');
        setLastScan({ type: method, value: resident.full_name || resident.name, time: new Date() });

        // Text to Speech
        const utterance = new SpeechSynthesisUtterance(`Bienvenido, ${resident.full_name || 'Residente'}. Acceso autorizado.`);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);

        // Create Access Log
        const newLog = {
            id: Date.now(),
            timestamp: new Date(),
            method: method,
            success: true,
            name: resident.full_name || resident.name,
            type: resident.type || 'Residente',
            snapshot_url: resident.profile_photo || null
        };
        setLogs(prev => [newLog, ...prev]);

        try {
            await api.post('/access/log', {
                resident_id: resident.id,
                method: method, // 'face', 'lpr', 'fingerprint'
                status: 'granted',
                details: `Acceso por ${method} - ${resident.unit_number || 'Sin unidad'}`
            });
        } catch (error) {
            console.error('Error logging access:', error);
        }

        // Show for just 3 seconds then resume scanning immediately
        setTimeout(() => {
            setAccessStatus('idle');
            setIdentifiedPerson(null);
            setProcessing(false); // Force release processing lock
        }, 3000);
    };

    const checkVehicle = (plate: string) => {
        // Normalize plate
        const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');

        const resident = residents.find(r =>
            r.vehicles?.some((v: any) => v.plate.replace(/[^A-Z0-9]/g, '') === cleanPlate)
        );

        if (resident) {
            handleAccessGranted(resident, 'lpr');
        } else {
            const utterance = new SpeechSynthesisUtterance(`Vehículo no autorizado`);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSimulateLPR = () => {
        // Trigger with a known fake plate or existing one if any
        // For testing, let's try to find a resident with a vehicle, or just use a dummy
        const dummyPlate = 'ABC123';
        setLastScan({ type: 'lpr', value: dummyPlate, time: new Date() });
        checkVehicle(dummyPlate);
    };

    const handleFingerprintScan = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setAccessStatus('granted');
            setIdentifiedPerson({ full_name: 'Personal de Seguridad', unit_number: 'Staff', profile_photo: null });
            setLastScan({ type: 'fingerprint', value: 'Huella Validada', time: new Date() });
            setTimeout(() => {
                setAccessStatus('idle');
                setIdentifiedPerson(null);
            }, 3000);
        }, 1500);
    };

    const handleIdScan = () => {
        const fakeId = '1098765432';
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setAccessStatus('granted');
            setIdentifiedPerson({ full_name: 'Visitante Registrado', unit_number: 'Torre A - 202', profile_photo: null });
            setLastScan({ type: 'id_card', value: `CC ${fakeId}`, time: new Date() });

            const utterance = new SpeechSynthesisUtterance(`Cédula verificada. Acceso autorizado.`);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);

            setTimeout(() => {
                setAccessStatus('idle');
                setIdentifiedPerson(null);
            }, 3000);
        }, 1000);
    };

    if (loading) return (
        <div className={`h-screen flex items-center justify-center font-mono ${isDarkMode ? 'bg-black text-blue-500' : 'bg-slate-50 text-blue-600'}`}>
            <RefreshCw className="animate-spin mr-2" /> INICIALIZANDO SISTEMAS DE SEGURIDAD...
        </div>
    );

    const theme = {
        bg: isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800',
        header: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm transition-colors',
        sidebarTitle: isDarkMode ? '' : 'text-slate-900',
        card: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm transition-colors',
        cardText: isDarkMode ? 'text-slate-200' : 'text-slate-800',
        cardSubtext: isDarkMode ? 'text-slate-500' : 'text-slate-400',
        logBg: isDarkMode ? 'bg-slate-800/50 border-emerald-500 text-white' : 'bg-emerald-50 border-emerald-500 text-slate-800',
        logHeader: isDarkMode ? 'text-emerald-400' : 'text-emerald-700',
        button: isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
    };

    return (
        <div className={`h-screen overflow-hidden flex flex-col transition-colors duration-300 ${theme.bg}`}>
            {/* Header / Status Bar */}
            <div className={`h-16 border-b flex items-center justify-between px-6 ${theme.header}`}>
                <div className="flex items-center gap-4">
                    <ShieldCheck className="text-emerald-500" size={28} />
                    <div>
                        <h1 className={`font-bold text-lg leading-none tracking-wider ${theme.sidebarTitle}`}>SECURE ACCESS v2.5</h1>
                        <span className="text-xs text-emerald-500 font-mono font-bold flex items-center gap-2">
                            {modelsLoaded ? (
                                <><span>SYSTEM ONLINE</span> <span>•</span> <span>MONITORING</span></>
                            ) : (
                                <><RefreshCw size={10} className="animate-spin" /> <span>LOADING AI MODELS...</span></>
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <CameraManager onSelectSource={(type, id) => {
                        if (type === 'face') setFaceCamId(id);
                        if (type === 'lpr') setLprCamId(id);
                    }} />

                    <button
                        onClick={() => window.location.href = '/'}
                        className={`px-4 py-2 rounded text-sm transition-colors font-medium ${theme.button}`}
                    >
                        Salir
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 p-4 grid grid-cols-12 gap-4">

                {/* Left: Biometrics (Face) */}
                <div className="col-span-8 grid grid-rows-2 gap-4">
                    <div className={`relative rounded-xl overflow-hidden border shadow-2xl row-span-2 ${isDarkMode ? 'bg-black border-slate-800' : 'bg-black border-slate-300'}`}>
                        {faceCamId ? (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                videoConstraints={{ deviceId: faceCamId }}
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600 bg-black">
                                <span className="font-mono">NO CAMERA SIGNAL</span>
                            </div>
                        )}

                        {/* Overlay Information */}
                        <div className="absolute top-4 left-4">
                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-mono text-emerald-400 border border-emerald-900">
                                BIOMETRIC_SCANNER_ACTIVE
                            </div>
                        </div>

                        {/* Scanner Rect */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                            <div className="w-80 h-80 border-2 border-emerald-500/30 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                {/* Corners */}
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                                {/* Scanning Laser */}
                                <div className="absolute left-2 right-2 h-1 bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan_2s_linear_infinite]"></div>

                                {/* Center Target */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-emerald-500/50"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-1 bg-emerald-500/10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-40 bg-emerald-500/10"></div>

                                {/* Tech Decorations */}
                                <div className="absolute top-2 right-2 text-[10px] font-mono text-emerald-500/70">REC</div>
                                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-500/70">ISO 800</div>
                            </div>
                        </div>

                        <style>{`
                            @keyframes scan {
                                0% { top: 5%; opacity: 0; }
                                20% { opacity: 1; }
                                80% { opacity: 1; }
                                100% { top: 95%; opacity: 0; }
                            }
                        `}</style>

                        {/* Result Modal */}
                        {accessStatus === 'granted' && identifiedPerson && (
                            <div className="absolute inset-x-4 bottom-8 mx-auto max-w-md bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 p-6 rounded-2xl flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-500 shadow-[0_0_80px_rgba(16,185,129,0.4)] z-50">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-400 bg-slate-800 mb-4 shadow-lg">
                                    <img
                                        src={identifiedPerson.profile_photo ? `http://localhost:3001${identifiedPerson.profile_photo}` : ''}
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?background=0D9488&color=fff'}
                                    />
                                </div>

                                <div className="w-full">
                                    <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{identifiedPerson.full_name || 'Identificado'}</h2>
                                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 font-mono text-sm border border-emerald-500/30 mb-4">
                                        <ShieldCheck size={14} />
                                        <span>ACCESO AUTORIZADO</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="text-right border-r border-white/10 pr-4">
                                            <p className="text-emerald-400/60 text-xs font-bold uppercase tracking-wider mb-1">TORRE / UNIDAD</p>
                                            <p className="text-white font-mono text-lg">{identifiedPerson.unit_number?.split('-')[0]?.trim() || 'N/A'}</p>
                                        </div>
                                        <div className="text-left pl-2">
                                            <p className="text-emerald-400/60 text-xs font-bold uppercase tracking-wider mb-1">APARTAMENTO</p>
                                            <p className="text-white font-mono text-lg">{identifiedPerson.unit_number?.split('-')[1]?.trim() || identifiedPerson.unit_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Result Modal - Denied */}
                        {accessStatus === 'denied' && identifiedPerson && (
                            <div className="absolute inset-x-4 bottom-8 mx-auto max-w-md bg-red-950/95 backdrop-blur-md border-[3px] border-red-500 p-6 rounded-2xl flex flex-col items-center text-center animate-in zoom-in-90 fade-in duration-300 shadow-[0_0_100px_rgba(220,38,38,0.6)] z-50">
                                <div className="w-24 h-24 rounded-full border-4 border-red-500 bg-red-900/50 mb-4 flex items-center justify-center animate-pulse overflow-hidden relative">
                                    {identifiedPerson.snapshot ? (
                                        <img src={identifiedPerson.snapshot} className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            {identifiedPerson.error === "INTENTO DE SUPLANTACIÓN" ? (
                                                <AlertTriangle className="text-yellow-500 animate-pulse" size={48} />
                                            ) : (
                                                <ShieldCheck className="text-red-500" size={48} />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-widest mb-1 font-mono">ACCESO DENEGADO</h2>
                                <p className="text-red-300 font-bold text-lg uppercase">{identifiedPerson.error}</p>
                                <p className="text-red-400/70 font-mono text-xs mt-1">{identifiedPerson.detail}</p>
                                <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-mono border border-red-500/30 px-3 py-1 rounded bg-red-950/50">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    INCIDENTE REGISTRADO
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: LPR & Logs */}
                <div className="col-span-4 flex flex-col gap-4">

                    {/* LPR Camera View */}
                    <div className={`h-64 rounded-xl overflow-hidden border relative shadow-lg ${isDarkMode ? 'bg-black border-slate-800' : 'bg-slate-900 border-slate-300'}`}>
                        <LPRView
                            deviceId={lprCamId}
                            onPlateDetected={(plate) => {
                                // Prevent duplicate scans in short time
                                if (lastScan?.value === plate && new Date().getTime() - lastScan.time.getTime() < 5000) return;

                                setLastScan({ type: 'lpr', value: plate, time: new Date() });
                                const utterance = new SpeechSynthesisUtterance(`Vehículo placa ${plate.split('').join(' ')} detectado`);
                                utterance.lang = 'es-ES';
                                window.speechSynthesis.speak(utterance);

                                // Here we would verify against vehicle database
                                checkVehicle(plate);
                            }}
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <button onClick={handleSimulateLPR} className="bg-white/90 text-slate-900 text-xs px-2 py-1 rounded font-medium shadow-sm hover:bg-white transition-colors">Simular Placa</button>
                        </div>
                    </div>

                    {/* Quick Stats / Controls */}
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            onClick={handleFingerprintScan}
                            className={`p-4 rounded-xl border cursor-pointer group active:scale-95 transition-all ${theme.card} hover:border-purple-400`}
                        >
                            <Fingerprint className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className={`text-sm font-bold ${theme.cardText}`}>Validar Huella</h3>
                            <p className={`text-xs ${theme.cardSubtext}`}>Tocar Sensor</p>
                        </div>
                        <div
                            onClick={() => {
                                if (processing) {
                                    // Show busy feedback
                                    const t = document.createElement('div');
                                    t.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded z-[100]';
                                    t.innerText = 'Procesando... Espere';
                                    document.body.appendChild(t);
                                    setTimeout(() => t.remove(), 1000);
                                } else {
                                    performFaceScan(true);
                                }
                            }}
                            className={`p-4 rounded-xl border cursor-pointer group active:scale-95 transition-all ${theme.card} hover:border-emerald-400`}
                        >
                            <Scan className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className={`text-sm font-bold ${theme.cardText}`}>Escanear Rostro</h3>
                            <p className={`text-xs ${theme.cardSubtext}`}>Modo Manual</p>
                        </div>
                        <div
                            onClick={handleIdScan}
                            className={`p-4 rounded-xl border cursor-pointer group active:scale-95 transition-all ${theme.card} hover:border-blue-400`}
                        >
                            <CreditCard className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className={`text-sm font-bold ${theme.cardText}`}>Escanear ID</h3>
                            <p className={`text-xs ${theme.cardSubtext}`}>Modo Teclado</p>
                        </div>
                    </div>

                    {/* Live Log Feed */}
                    <div className={`flex-1 rounded-xl border p-4 overflow-hidden flex flex-col ${theme.card}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <span>Registro en Vivo</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${filter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'}`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilter('granted')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${filter === 'granted' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                >
                                    Auth
                                </button>
                                <button
                                    onClick={() => setFilter('denied')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${filter === 'denied' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                >
                                    No Auth
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {logs.filter(l => filter === 'all' || (filter === 'granted' && l.success) || (filter === 'denied' && !l.success)).map((log, idx) => (
                                <div
                                    key={log.id || idx}
                                    onClick={() => !log.success && setSelectedLog(log)} // Only click for unauthorized to see proof? Or all? User said "click para que se abra a los no autorizados". I'll enable for all but emphasize unauthorized.
                                    className={`p-3 rounded border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${log.success
                                        ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-500' : 'bg-emerald-50 border-emerald-500')
                                        : (isDarkMode ? 'bg-red-950/30 border-red-500' : 'bg-red-50 border-red-500')
                                        }`}
                                >
                                    <div className="flex justify-between text-xs mb-1 font-bold opacity-70">
                                        <span className="uppercase">{log.method}</span>
                                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-sm truncate max-w-[180px]">
                                            {log.name}
                                        </div>
                                        {log.success ? (
                                            <ShieldCheck size={16} className="text-emerald-500" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        )}
                                    </div>
                                    {!log.success && (
                                        <div className="text-[10px] mt-1 opacity-60 font-mono">
                                            {log.details || 'Acceso Denegado'}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-xs italic">
                                    No hay registros recientes
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Evidence Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedLog(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className={`p-4 flex justify-between items-center border-b ${selectedLog.success ? 'bg-emerald-950/50 border-emerald-900' : 'bg-red-950/50 border-red-900'}`}>
                            <h3 className={`font-bold text-lg flex items-center gap-2 ${selectedLog.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedLog.success ? <ShieldCheck /> : <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                                {selectedLog.success ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center">
                                <div className={`w-64 h-64 rounded-xl overflow-hidden border-4 mb-6 shadow-2xl relative bg-black ${selectedLog.success ? 'border-emerald-500/50' : 'border-red-500'}`}>
                                    {selectedLog.snapshot_url ? (
                                        <img
                                            src={selectedLog.snapshot_url.startsWith('data:') ? selectedLog.snapshot_url : `http://localhost:3001${selectedLog.snapshot_url}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                            <Scan size={48} />
                                            <span className="text-xs mt-2 uppercase font-mono">Sin Evidencia Visual</span>
                                        </div>
                                    )}
                                    {!selectedLog.success && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                                            EVIDENCIA
                                        </div>
                                    )}
                                </div>

                                <div className="w-full grid grid-cols-2 gap-4 text-sm font-mono">
                                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                        <div className="text-slate-500 text-[10px] uppercase">Hora</div>
                                        <div className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                        <div className="text-slate-500 text-[10px] uppercase">Método</div>
                                        <div className="text-white uppercase">{selectedLog.method}</div>
                                    </div>
                                    <div className="col-span-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                                        <div className="text-slate-500 text-[10px] uppercase">Detalle / Motivo</div>
                                        <div className={selectedLog.success ? 'text-emerald-300' : 'text-red-300'}>{selectedLog.details || selectedLog.notes || 'Sin detalles adicionales'}</div>
                                    </div>
                                    <div className="col-span-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                                        <div className="text-slate-500 text-[10px] uppercase">Nombre Identificado</div>
                                        <div className="text-white font-bold text-lg">{selectedLog.name}</div>
                                        <div className="text-slate-400 text-xs">{selectedLog.type}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition w-full"
                            >
                                Cerrar Reporte
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
