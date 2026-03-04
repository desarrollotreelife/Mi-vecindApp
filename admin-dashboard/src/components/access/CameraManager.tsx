import React, { useState, useEffect } from 'react';
import { Camera, Settings, Monitor } from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraManagerProps {
    onSelectSource: (type: 'face' | 'lpr', deviceId: string) => void;
}

export const CameraManager: React.FC<CameraManagerProps> = ({ onSelectSource }) => {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedFaceCam, setSelectedFaceCam] = useState<string>('');
    const [selectedLprCam, setSelectedLprCam] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        getDevices();
    }, []);

    const getDevices = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }); // Request permissions
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);

            // Auto-select defaults if not set
            if (videoDevices.length > 0 && !selectedFaceCam) {
                setSelectedFaceCam(videoDevices[0].deviceId);
                onSelectSource('face', videoDevices[0].deviceId);
            }
            if (videoDevices.length > 1 && !selectedLprCam) {
                setSelectedLprCam(videoDevices[1].deviceId);
                onSelectSource('lpr', videoDevices[1].deviceId);
            } else if (videoDevices.length > 0 && !selectedLprCam) {
                // If only 1 camera, use it for both? Or leave null?
                // Better to leave explicit.
                // setSelectedLprCam(videoDevices[0].deviceId); 
            }
        } catch (error) {
            console.error("Error listing devices:", error);
        }
    };

    const handleChange = (type: 'face' | 'lpr', deviceId: string) => {
        if (type === 'face') setSelectedFaceCam(deviceId);
        else setSelectedLprCam(deviceId);
        onSelectSource(type, deviceId);
    };

    if (!isOpen) {
        return (
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
                <Settings size={16} /> Configurar Cámaras
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md text-white shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Monitor className="text-blue-400" />
                        Fuentes de Video
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                            <Camera size={16} /> Cámara Principal (Biometría Facial)
                        </label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedFaceCam}
                            onChange={(e) => handleChange('face', e.target.value)}
                        >
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Cámara ${d.deviceId.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                            <Monitor size={16} /> Cámara LPR (Placas Vehiculares)
                        </label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
                            value={selectedLprCam}
                            onChange={(e) => handleChange('lpr', e.target.value)}
                        >
                            <option value="">-- Sin cámara asignada --</option>
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Cámara ${d.deviceId.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Esta cámara se usará para detectar placas automáticamente.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={() => setIsOpen(false)}>Guardar Configuración</Button>
                </div>
            </div>
        </div>
    );
};
