import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const ResidentPaymentsPage: React.FC = () => {
    const [bills, setBills] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchBills = async () => {
        try {
            const response = await api.get('/finance/my-statement');
            if (response.data && response.data.bills) {
                setBills(response.data.bills);
            }
        } catch (err) {
            console.error('Error fetching bills:', err);
            setError('No se pudo cargar la información de pagos.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBills();
    }, []);

    const handlePay = async (bill: any) => {
        try {
            // 1. Get payment data from backend
            const res = await api.post('/payments/epayco-data', {
                billId: bill.id,
                // userId is handled by backend from token
            });

            const data = res.data;

            // 2. Open ePayco Checkout
            // @ts-ignore
            const handler = window.ePayco.checkout.configure({
                key: '491d6a0b6e992cf924edd8d3d088aff1', // Public Key (Test)
                test: true
            });

            handler.open({
                //Parametros compra (obligatorio)
                name: "Pago Administración",
                description: data.description,
                invoice: data.invoice,
                currency: "cop",
                amount: data.amount,
                tax_base: "0",
                tax: "0",
                country: "co",
                lang: "es",
                external: "false",
                //Atributos opcionales
                extra1: `bill_${bill.id}`,
                response: data.responseUrl,
                confirmation: data.confirmationUrl,
                //Atributos cliente (Opcional: Prellenar con datos del usuario si los tuvieramos)
            });

        } catch (e: any) {
            alert('Error iniciando pagos: ' + e.message);
        }
    };

    if (loading) return <div>Cargando pagos...</div>;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-slate-800">Mis Pagos</h1>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="space-y-4">
                {bills.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-8">No tienes pagos pendientes.</p>
                ) : (
                    bills.map(bill => (
                        <div key={bill.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{bill.description}</h3>
                                    <p className="text-xs text-slate-500">Vence: {new Date(bill.due_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-lg text-slate-900">${Number(bill.amount).toLocaleString()}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${bill.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {bill.status === 'pending' ? 'Pendiente' : 'Pagado'}
                                    </span>
                                </div>
                            </div>

                            {bill.status === 'pending' && (
                                <Button className="w-full mt-2" size="sm" onClick={() => handlePay(bill)}>
                                    <CreditCard size={16} className="mr-2" /> Pagar con ePayco
                                </Button>
                            )}

                            {bill.status === 'paid' && (
                                <div className="flex items-center gap-2 text-green-600 text-xs font-medium mt-2 bg-green-50 p-2 rounded-lg">
                                    <CheckCircle size={14} /> Pagado
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
