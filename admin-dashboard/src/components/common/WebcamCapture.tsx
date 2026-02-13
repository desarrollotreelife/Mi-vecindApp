import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface WebcamCaptureProps {
    onCapture: (imageSrc: string) => void;
    onClose: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onClose }) => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    const capture = useCallback(() => {
        try {
            const imageSrc = webcamRef.current?.getScreenshot();
            if (imageSrc) {
                setImgSrc(imageSrc);
            } else {
                console.warn("Webcam screenshot returned null");
            }
        } catch (error) {
            console.error("Error capturing photo:", error);
            alert("Error al tomar la foto. Intente de nuevo.");
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const confirm = () => {
        if (imgSrc) {
            onCapture(imgSrc);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                        <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                            videoConstraints={{
                                facingMode: "user",
                                width: { ideal: 640 },
                                height: { ideal: 480 }
                            }}
                            width={640}
                            height={480}
                            screenshotQuality={0.6}
                            onUserMediaError={(err) => {
                                console.error('Webcam error:', err);
                                alert('No se pudo acceder a la cámara. Verifique los permisos.');
                                onClose();
                            }}
                        />
                    )}
                </div>

                <div className="p-4 flex items-center justify-between bg-white border-t border-slate-100">
                    <Button variant="ghost" onClick={onClose} icon={X}>
                        Cancelar
                    </Button>

                    <div className="flex gap-2">
                        {imgSrc ? (
                            <>
                                <Button variant="outline" onClick={retake} icon={RefreshCw}>
                                    Repetir
                                </Button>
                                <Button onClick={confirm} icon={Check}>
                                    Confirmar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={capture} icon={Camera}>
                                Capturar Foto
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
