import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle, Scan, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WebcamCapture } from '../components/common/WebcamCapture';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { VisitForm } from '../components/visits/VisitForm';

export const VisitsPage: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [scannerMode, setScannerMode] = useState(false);
    const [scanInput, setScanInput] = useState('');

    // New states for enhanced scanner
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'processing' | 'success' | 'error' | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const res = await api.get('/visits');
            setVisits(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    const handleSimulateScan = () => {
        if (!scanInput) return;
        setVerificationStatus('processing');
        setTimeout(() => {
            setVerificationStatus('success');
            setScanInput('');
        }, 1500);
    };

    const handleFaceScan = (_imageSrc: string) => {
        // Here we would send the image to backend
        setVerificationStatus('processing');
        setTimeout(() => {
            setVerificationStatus('success');
        }, 2000);
    };

    const handleRegisterEntry = async (visitId: number) => {
        try {
            await api.post(`/visits/${visitId}/entry`);
            fetchVisits();
        } catch (error) {
            console.error(error);
            alert('Error al registrar entrada');
        }
    };

    const handleRegisterExit = async (visitId: number) => {
        try {
            await api.post(`/visits/${visitId}/exit`);
            fetchVisits();
        } catch (error) {
            console.error(error);
            alert('Error al registrar salida');
        }
    };

    const filteredVisits = visits.filter(v => {
        if (activeTab === 'active') {
            return v.status === 'active' || v.status === 'pending' || v.status === 'scheduled';
        } else {
            return v.status === 'completed' || v.status === 'rejected';
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Control de Visitas</h1>
                    <p className="text-slate-500">Agenda y registro de ingresos al conjunto.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={Scan} onClick={() => setScannerMode(!scannerMode)}>
                        {scannerMode ? 'Cerrar Escáner' : 'Simular Lector'}
                    </Button>
                    <Button icon={Plus} onClick={() => setIsFormOpen(true)}>Registrar Ingreso</Button>
                </div>
            </div>


            {/* Scanner Simulator */}
            {scannerMode && (
                <div className="bg-slate-800 text-white p-6 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-mono flex items-center gap-2">
                            <Scan className="text-green-400" /> Terminal de Acceso
                        </h3>
                    </div>


                    {/* Access Verification Overlay - Simulation Result */}
                    {verificationStatus && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md animate-in fade-in">
                            <div className="text-center p-8">
                                {verificationStatus === 'processing' && (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-xl font-mono text-primary-400 animate-pulse">Analizando biometría...</p>
                                    </div>
                                )}
                                {verificationStatus === 'success' && (
                                    <div className="flex flex-col items-center gap-4 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                                            <CheckCircle size={40} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">ACCESO AUTORIZADO</h2>
                                            <p className="text-slate-400">Bienvenido, Residente</p>
                                        </div>
                                        <Button onClick={() => setVerificationStatus(null)} variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-800">
                                            Nueva Consulta
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider">Documento de Identidad</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                        placeholder="Escanee documento..."
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan()}
                                        autoFocus
                                    />
                                    <Button onClick={handleSimulateScan} className="bg-primary-600 hover:bg-primary-500 text-on-primary px-6">
                                        VERIFICAR
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Logs del sistema</h4>
                                <div className="font-mono text-xs space-y-1 text-slate-400 h-24 overflow-y-auto">
                                    <p><span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> Sistema iniciado correctamente</p>
                                    <p><span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> Conectado a servidor de control de acceso</p>
                                    <p><span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> Cámaras perimetrales online</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 flex flex-col">
                            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider text-center md:text-left">Reconocimiento Facial</label>

                            <div className="flex-1 bg-black rounded-lg border-2 border-slate-700 overflow-hidden relative group aspect-video md:aspect-auto">
                                {/* Simulated Camera View if not active */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-900">
                                    <Scan size={32} className="mb-2 opacity-50" />
                                    <span className="text-xs">Cámara en espera</span>
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowFaceCamera(true)}
                                    className="absolute inset-0 w-full h-full hover:bg-primary-500/10 flex flex-col items-center justify-center gap-2 text-primary-400 transition-all border-none"
                                >
                                    <Camera size={32} />
                                    <span className="font-medium">ACTIVAR CÁMARA</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Webcam Modal */}
            {showFaceCamera && (
                <WebcamCapture
                    onCapture={(img) => {
                        setShowFaceCamera(false);
                        handleFaceScan(img);
                    }}
                    onClose={() => setShowFaceCamera(false)}
                />
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900">Pendientes Hoy</p>
                        <p className="text-2xl font-bold text-blue-700">{visits.filter(v => v.status === 'pending').length}</p>
                    </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-900">Ingresos Activos</p>
                        <p className="text-2xl font-bold text-emerald-700">{visits.filter(v => v.status === 'active').length}</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Total Histórico</p>
                        <p className="text-2xl font-bold text-slate-700">{visits.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'active' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('active')}
                >
                    Visitas Activas
                </button>
                <button
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Historial
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Cargando visitas...</div>
            ) : (
                <Table
                    data={filteredVisits}
                    columns={[
                        {
                            header: 'Foto',
                            accessor: (v) => v.visitor?.photo_url,
                            render: (val) => val ? (
                                <img
                                    src={val.startsWith('http') ? val : `http://localhost:3001${val}`}
                                    alt="Visitor"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Visitor&background=random';
                                    }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Scan size={16} />
                                </div>
                            )
                        },
                        { header: 'Visitante', accessor: (v) => v.visitor?.name, className: 'font-medium' },
                        { header: 'Documento', accessor: (v) => v.visitor?.document_num },
                        {
                            header: 'Residente',
                            accessor: (v) => `${v.resident?.user?.full_name || 'N/A'}`,
                            className: 'text-sm text-slate-500'
                        },
                        {
                            header: 'QR',
                            accessor: (v) => v.qr_token && (v.status === 'pending' || v.status === 'active') ? (
                                <div className="bg-white p-1 rounded border border-slate-200 inline-block">
                                    <QRCodeSVG value={v.qr_token} size={48} />
                                </div>
                            ) : null
                        },
                        {
                            header: 'Fecha Programada',
                            accessor: (v) => v.scheduled_entry ? new Date(v.scheduled_entry).toLocaleString() : 'N/A'
                        },
                        { header: 'Vehículo', accessor: 'vehicle_plate' },
                        {
                            header: 'Estado',
                            accessor: (item) => {
                                const statusMap: Record<string, { label: string, variant: 'success' | 'warning' | 'default' | 'error' }> = {
                                    'active': { label: 'En sitio', variant: 'success' },
                                    'pending': { label: 'Programada', variant: 'warning' },
                                    'completed': { label: 'Finalizada', variant: 'default' },
                                    'rejected': { label: 'Rechazada', variant: 'error' }
                                };
                                const config = statusMap[item.status] || { label: item.status, variant: 'default' };
                                return (
                                    <Badge variant={config.variant}>
                                        {config.label}
                                    </Badge>
                                );
                            }
                        },
                    ]}
                    actions={(item) => (
                        <div className="flex gap-2">
                            {item.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => handleRegisterEntry(item.id)}>Entrada</Button>
                            )}
                            {item.status === 'active' && (
                                <Button size="sm" variant="secondary" onClick={() => handleRegisterExit(item.id)}>Salida</Button>
                            )}
                        </div>
                    )}
                />
            )}

            <VisitForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchVisits}
            />
        </div>
    );
};
