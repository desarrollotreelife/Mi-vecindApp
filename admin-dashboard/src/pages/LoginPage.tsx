import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const LoginPage = () => {
    const [documentNum, setDocumentNum] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    // Registration Form State
    const [isRegistering, setIsRegistering] = useState(false);
    const [regData, setRegData] = useState({
        full_name: '',
        document_num: '',
        email: '',
        phone: '',
        unit_id: '',
        requested_role: 'propietario',
        password: ''
    });
    const [units, setUnits] = useState<any[]>([]);
    const [regSuccess, setRegSuccess] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Custom Complex Login
    const { slug } = useParams<{ slug?: string }>();
    const [complexInfo, setComplexInfo] = useState<{ name: string, logo_url: string | null } | null>(null);

    useEffect(() => {
        if (slug) {
            api.get(`/auth/complex/${slug}`)
                .then(res => setComplexInfo(res.data))
                .catch(err => {
                    console.error("Invalid or inactive complex URL:", err);
                    setError('Este enlace de acceso no es válido o está inactivo.');
                });

            api.get(`/auth/complex/${slug}/units`)
                .then(res => setUnits(res.data))
                .catch(err => console.error("Could not fetch units", err));
        }
    }, [slug]);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setRegSuccess('');
        setLoading(true);

        try {
            const data = { ...regData, slug, unit_id: Number(regData.unit_id) };
            if (!slug) throw new Error("Debe ingresar a través del link de un conjunto específico.");
            const res = await api.post('/auth/request-access', data);

            setRegSuccess(res.data.message || 'Solicitud enviada correctamente');
            setTimeout(() => {
                setIsRegistering(false);
                setRegSuccess('');
                setRegData({ full_name: '', document_num: '', email: '', phone: '', unit_id: '', requested_role: 'propietario', password: '' });
            }, 5000);
        } catch (error: any) {
            setError(error.response?.data?.error || error.message || 'Error al enviar solicitud');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (is2FARequired) {
                // Verify 2FA
                const response = await api.post('/auth/verify-2fa', { userId, code: twoFactorCode });
                const { token, user } = response.data;
                login(token, user);
                navigate('/');
            } else {
                // Normal Login
                const response = await api.post('/auth/login', { document_num: documentNum, password, slug });

                if (response.data.status === '2fa_required') {
                    setUserId(response.data.userId);
                    setIs2FARequired(true);
                    setLoading(false); // Stop loading to show input
                    alert(response.data.message); // Demo: Tell user code was sent
                    return;
                }

                const { token, user } = response.data;
                login(token, user);

                const role = typeof user.role === 'string' ? user.role : user.role?.name || '';
                const lowerRole = role.toLowerCase().trim();
                console.log('Login Success. Role:', lowerRole);

                if (lowerRole === 'superadmin') {
                    navigate('/super-admin');
                } else if (['guard', 'vigilante', 'celador'].includes(lowerRole)) {
                    navigate('/access-terminal');
                } else if (['resident', 'propietario', 'residente_propietario', 'residentepropietario'].includes(lowerRole)) {
                    navigate('/resident');
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.error || 'Error de conexión';
            setError(msg);
        } finally {
            if (!is2FARequired) setLoading(false);
            if (is2FARequired) setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 relative z-10">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                    {!isRegistering ? (
                        <>
                            <div className="text-center mb-10">
                                {/* Branding Hierarchy */}
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 tracking-tight">
                                    Mi VecindApp
                                </h1>
                                {complexInfo && (
                                    <div className="mt-3 inline-block px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                                        <p className="text-sm font-medium text-slate-500">
                                            Acceso de <span className="font-bold text-slate-700">{complexInfo.name}</span>
                                        </p>
                                    </div>
                                )}
                                <p className="text-slate-500 mt-4 text-lg">
                                    {is2FARequired ? 'Ingrese el código de 6 dígitos enviado.' : 'Bienvenido de nuevo'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!is2FARequired ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Número de Documento (Cédula)</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={documentNum}
                                                    onChange={(e) => setDocumentNum(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ingrese su número de documento"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Código de Verificación</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 text-on-primary py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50"
                                >
                                    {loading ? 'Verificando...' : (is2FARequired ? 'Verificar Código' : 'Iniciar Sesión')}
                                </button>
                            </form>

                            {/* Link para Solicitar Registro */}
                            {!is2FARequired && slug && (
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-slate-500">
                                        ¿No tienes cuenta?{' '}
                                        <button
                                            type="button"
                                            onClick={() => { setError(''); setIsRegistering(true); }}
                                            className="text-primary-600 font-semibold hover:underline"
                                        >
                                            Solicitar Registro
                                        </button>
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        // Registration Form UI
                        <>
                            <div className="text-center mb-6">
                                <button
                                    onClick={() => { setIsRegistering(false); setError(''); setRegSuccess(''); }}
                                    className="absolute left-6 top-6 text-slate-400 hover:text-slate-600"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className="text-2xl font-bold text-slate-800">Solicitud de Registro</h2>
                                {complexInfo && (
                                    <p className="text-sm text-slate-500 mt-1">Para el conjunto <br /><span className="font-semibold text-slate-700">{complexInfo.name}</span></p>
                                )}
                            </div>

                            {regSuccess ? (
                                <div className="p-6 rounded-2xl bg-green-50 text-center">
                                    <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="text-lg font-bold text-green-800 mb-2">¡Solicitud Enviada!</h3>
                                    <p className="text-sm text-green-700 mb-6">{regSuccess}</p>
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                                    >
                                        Volver a Iniciar Sesión
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                                        <input type="text" required value={regData.full_name} onChange={e => setRegData({ ...regData, full_name: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej. Juan Pérez" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula</label>
                                            <input type="text" required value={regData.document_num} onChange={e => setRegData({ ...regData, document_num: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="102..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                                            <input type="tel" value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="300..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                                        <input type="email" required value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="correo@ejemplo.com" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad/Apartamento</label>
                                            <select required value={regData.unit_id} onChange={e => setRegData({ ...regData, unit_id: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                                                <option value="">Seleccione...</option>
                                                {units.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.block ? `${u.block} - ${u.number}` : u.number}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Residente</label>
                                            <select required value={regData.requested_role} onChange={e => setRegData({ ...regData, requested_role: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                                                <option value="propietario">Propietario</option>
                                                <option value="residente_propietario">Residente Propietario</option>
                                                <option value="residente">Residente (Arrendat)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Crear Contraseña</label>
                                        <input type="password" required value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="••••••••" />
                                    </div>

                                    {error && <div className="p-2 rounded bg-red-50 text-xs text-red-600 mt-2">{error}</div>}

                                    <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white rounded-lg py-2.5 font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 mt-4">
                                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
