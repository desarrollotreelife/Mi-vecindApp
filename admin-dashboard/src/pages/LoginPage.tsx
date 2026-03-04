import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, KeyRound } from 'lucide-react';
import api from '../services/api';

export const LoginPage = () => {
    const [documentNum, setDocumentNum] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

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
                const response = await api.post('/auth/login', { document_num: documentNum, password });

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
                } else if (['guard', 'vigilante'].includes(lowerRole)) {
                    navigate('/access-terminal');
                } else if (lowerRole === 'resident') {
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
                <div className="w-full p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {is2FARequired ? 'Verificación de Seguridad' : 'Mi VecindApp'}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
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
                </div>
            </div>
        </div>
    );
};
