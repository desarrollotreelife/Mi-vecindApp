import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Scan, AlertTriangle } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface LPRViewProps {
    deviceId: string;
    onPlateDetected?: (plate: string) => void;
}

export const LPRView: React.FC<LPRViewProps> = ({ deviceId, onPlateDetected }) => {
    const webcamRef = useRef<Webcam>(null);
    const [scanning, setScanning] = useState(false);
    const [lastRead, setLastRead] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);

    // LPR Loop
    useEffect(() => {
        if (!deviceId) return;

        let intervalId: NodeJS.Timer;
        const scanPlate = async () => {
            if (!webcamRef.current || scanning) return;

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            setScanning(true);
            try {
                // Tesseract OCR
                const result = await Tesseract.recognize(
                    imageSrc,
                    'eng', // English is usually fine for alphanumeric plates
                    {
                        logger: m => { } // detailed logs disabled for performance
                    }
                );

                // Process text: keep only alphanumeric, uppercase
                const cleanText = result.data.text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

                // Regex for Colombian plates (AAA123 or AAA12C for motorcycles)
                // Just matching basic patterns for now: 3 letters + 3 numbers
                const plateMatch = cleanText.match(/[A-Z]{3}[0-9]{3}/);

                if (plateMatch && plateMatch[0]) {
                    const detected = plateMatch[0];
                    setLastRead(detected);
                    setConfidence(result.data.confidence);

                    if (onPlateDetected && result.data.confidence > 70) {
                        onPlateDetected(detected);
                    }
                }
            } catch (err) {
                console.error('LPR Error:', err);
            } finally {
                setScanning(false);
            }
        };

        // Scan every 2 seconds to avoid overwhelming the browser
        intervalId = setInterval(scanPlate, 2000);

        return () => clearInterval(intervalId);
    }, [deviceId, scanning, onPlateDetected]);

    if (!deviceId) {
        return (
            <div className="h-full bg-slate-900 border-2 border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-600">
                <Scan size={48} className="mb-2 opacity-50" />
                <span>Cámara LPR Desactivada</span>
            </div>
        );
    }

    return (
        <div className="relative h-full rounded-lg overflow-hidden border-2 border-slate-700 bg-black group">
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ deviceId }}
                className="w-full h-full object-cover opacity-80"
            />

            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-green-400 font-mono border border-green-900/50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`}></span>
                {scanning ? 'ANALYZING...' : 'LPR ONLINE'}
            </div>

            {lastRead && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 p-2 rounded border border-slate-700 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-slate-400">ÚLTIMA LECTURA</div>
                        <div className="text-xl font-mono font-bold text-white tracking-widest">{lastRead}</div>
                    </div>
                    <div className={`text-xs font-bold ${confidence > 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {Math.round(confidence)}%
                    </div>
                </div>
            )}

            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 border-2 border-green-500/20 m-8 rounded border-dashed pointer-events-none group-hover:border-green-500/50 transition-colors flex items-center justify-center">
                <div className="w-full h-[1px] bg-red-500/30"></div>
                <div className="absolute h-full w-[1px] bg-red-500/30"></div>
            </div>
        </div>
    );
};
