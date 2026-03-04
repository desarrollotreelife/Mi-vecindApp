import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PaymentResponsePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [transaction, setTransaction] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const refPayco = searchParams.get('ref_payco');

    useEffect(() => {
        if (!refPayco) {
            setError('No se encontró la referencia de pago.');
            setLoading(false);
            return;
        }

        const fetchTransactionStatus = async () => {
            try {
                // ePayco public API to fetch transaction status
                const response = await fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`);
                const data = await response.json();

                if (data.success) {
                    setTransaction(data.data);
                } else {
                    setError('No se pudo validar la transacción con ePayco.');
                }
            } catch (err) {
                console.error('Error fetching ePayco reference:', err);
                setError('Error de conexión al validar el pago.');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactionStatus();
    }, [refPayco]);

    const getStatusDisplay = () => {
        if (!transaction) return null;

        const code = Number(transaction.x_cod_response);

        switch (code) {
            case 1:
                return {
                    icon: <CheckCircle className="text-green-500 w-16 h-16" />,
                    title: '¡Pago Exitoso!',
                    message: `Tu pago por ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(transaction.x_amount)} ha sido procesado correctamente.`,
                    color: 'text-green-600'
                };
            case 2:
                return {
                    icon: <XCircle className="text-red-500 w-16 h-16" />,
                    title: 'Pago Rechazado',
                    message: 'La transacción fue rechazada por la entidad bancaria.',
                    color: 'text-red-600'
                };
            case 3:
                return {
                    icon: <Clock className="text-orange-500 w-16 h-16" />,
                    title: 'Pago Pendiente',
                    message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
                    color: 'text-orange-600'
                };
            default:
                return {
                    icon: <XCircle className="text-gray-500 w-16 h-16" />,
                    title: 'Error en Pago',
                    message: transaction.x_response || 'No se pudo completar la transacción.',
                    color: 'text-gray-600'
                };
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Validando tu pago...</p>
            </div>
        </div>
    );

    const display = getStatusDisplay();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-t-4 border-indigo-600">
                {error ? (
                    <>
                        <XCircle className="text-red-500 w-16 h-16 mx-auto" />
                        <h1 className="text-2xl font-bold text-slate-800">Ups! Algo salió mal</h1>
                        <p className="text-slate-600">{error}</p>
                    </>
                ) : display ? (
                    <>
                        <div className="mx-auto flex justify-center">{display.icon}</div>
                        <h1 className={`text-2xl font-bold ${display.color}`}>{display.title}</h1>
                        <p className="text-slate-600 leading-relaxed">{display.message}</p>

                        <div className="bg-slate-50 p-4 rounded-lg text-left text-sm space-y-2 border border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Referencia:</span>
                                <span className="font-mono font-medium">{transaction.x_ref_payco}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Factura:</span>
                                <span className="font-medium">{transaction.x_id_invoice}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Fecha:</span>
                                <span className="font-medium">{transaction.x_fecha_transaccion}</span>
                            </div>
                        </div>
                    </>
                ) : null}

                <div className="pt-4">
                    <Button
                        className="w-full py-6 text-lg shadow-lg hover:shadow-xl transition-shadow"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
                    </Button>
                </div>
            </Card>
        </div>
    );
};
