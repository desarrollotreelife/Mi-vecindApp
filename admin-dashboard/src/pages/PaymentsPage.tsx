
import React, { useState, useEffect } from 'react';
import { CheckCircle, DollarSign, Home, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export const PaymentsPage: React.FC = () => {
    // Structure Data
    const [structure, setStructure] = useState<Record<string, any[]>>({});
    const [selectedBlock, setSelectedBlock] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);

    // Billing Data
    const [statement, setStatement] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateBill, setShowCreateBill] = useState(false);
    const [billData, setBillData] = useState({ amount: '', description: '', type: 'admin_fee', dueDate: '' });

    // Fetch Structure on Load
    useEffect(() => {
        fetchStructure();
    }, []);

    const fetchStructure = async () => {
        try {
            const response = await api.get('/units/structure');
            setStructure(response.data);

            // Auto-select first block if available
            const blocks = Object.keys(response.data);
            if (blocks.length > 0) setSelectedBlock(blocks[0]);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching structure:', error);
            setLoading(false);
        }
    };

    const fetchStatement = async (unitId: number) => {
        setStatement(null); // Clear previous
        try {
            const response = await api.get(`/finance/statement/${unitId}`);
            setStatement(response.data);
        } catch (error) {
            console.error('Error fetching statement:', error);
        }
    };

    const handleSelectUnit = (unit: any) => {
        setSelectedUnit(unit);
        fetchStatement(unit.id);
    };

    const handleCreateBill = async () => {
        if (!selectedUnit) return;
        try {
            await api.post('/finance/bills', {
                unitId: selectedUnit.id,
                amount: billData.amount,
                description: billData.description,
                type: billData.type,
                dueDate: billData.dueDate || new Date().toISOString()
            });
            setShowCreateBill(false);
            fetchStatement(selectedUnit.id); // Refresh
            alert('Cuenta de cobro creada');
        } catch (error: any) {
            alert('Error: ' + error.response?.data?.error);
        }
    };

    const handlePayBill = async (billId: number, amount: number) => {
        if (!confirm('¿Registrar pago completo para esta factura?')) return;
        try {
            await api.post('/finance/pay', {
                billId,
                amount,
                method: 'cash', // Default logging as cash for admin
                reference: 'Ventanilla' // Default ref
            });
            fetchStatement(selectedUnit.id);
            alert('Pago registrado');
        } catch (error: any) {
            alert('Error al pagar: ' + error.response?.data?.error);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pagos y Cartera</h1>
                    <p className="text-slate-500">Gestión financiera por apartamento</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Panel: Navigation */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-4 bg-slate-50 border-b">
                        <label className="text-xs font-bold text-slate-500 uppercase">Torre / Bloque</label>
                        <select
                            className="w-full mt-1 p-2 border rounded"
                            value={selectedBlock}
                            onChange={(e) => {
                                setSelectedBlock(e.target.value);
                                setSelectedUnit(null);
                            }}
                        >
                            <option value="">Seleccione...</option>
                            {Object.keys(structure).map(block => (
                                <option key={block} value={block}>{block}</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {selectedBlock && structure[selectedBlock]?.map((unit: any) => (
                            <div
                                key={unit.id}
                                onClick={() => handleSelectUnit(unit)}
                                className={`p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedUnit?.id === unit.id
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium border'
                                    : 'hover:bg-slate-50 border border-transparent text-slate-600'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Home size={16} />
                                    Apto {unit.number}
                                </span>
                                {unit.residents?.length > 0 && <User size={14} className="text-slate-400" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Detail & Actions */}
                <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
                    {selectedUnit ? (
                        <>
                            {/* Header Card */}
                            <Card className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                            {selectedBlock} - {selectedUnit.number}
                                            {statement?.summary?.solvency === 'En Mora' && (
                                                <Badge variant="error">EN MORA</Badge>
                                            )}
                                            {statement?.summary?.solvency === 'Solvente' && (
                                                <Badge variant="success">AL DÍA</Badge>
                                            )}
                                        </h2>
                                        <p className="text-slate-500">
                                            Propietario(s): {selectedUnit.residents?.map((r: any) => r.user?.full_name).join(', ') || 'Sin registrar'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-400">Total Pendiente</p>
                                        <p className={`text-3xl font-bold ${statement?.summary?.pendingTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(statement?.summary?.pendingTotal || 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button onClick={() => setShowCreateBill(true)}>
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Crear Cuenta de Cobro
                                    </Button>
                                    <Button variant="secondary" onClick={() => fetchStatement(selectedUnit.id)}>
                                        Actualizar
                                    </Button>
                                </div>
                            </Card>

                            {/* Bills List */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700">Historial de Finanzas</h3>
                                {statement?.bills?.length === 0 ? (
                                    <p className="text-slate-400 italic">No hay registros financieros.</p>
                                ) : (
                                    statement?.bills?.map((bill: any) => (
                                        <Card key={bill.id} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {bill.status === 'paid' ? <CheckCircle size={20} /> : <DollarSign size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{bill.description}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Vencimiento: {new Date(bill.due_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-bold text-slate-700">{formatCurrency(bill.amount)}</span>
                                                {bill.status !== 'paid' ? (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => handlePayBill(bill.id, bill.amount)}>
                                                            Efec.
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                try {
                                                                    // 1. Get payment data from backend
                                                                    const res = await api.post('/payments/epayco-data', {
                                                                        billId: bill.id,
                                                                        userId: selectedUnit.residents[0]?.user_id // Assuming current user context or selected unit resident
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
                                                                        //Onpage="false" - Standard Mode
                                                                        //Onpage="true" - OnePage Mode
                                                                        external: "false",
                                                                        //Atributos opcionales
                                                                        extra1: `bill_${bill.id}`,
                                                                        response: data.responseUrl,
                                                                        confirmation: data.confirmationUrl,
                                                                        //Atributos cliente
                                                                        name_billing: "Juan Residente",
                                                                        address_billing: "Calle 123",
                                                                        type_doc_billing: "cc",
                                                                        mobilephone_billing: "3000000000",
                                                                        number_doc_billing: "123456789"
                                                                    });

                                                                } catch (e: any) {
                                                                    alert('Error iniciando pagos: ' + e.message);
                                                                }
                                                            }}
                                                        >
                                                            ePayco
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Badge variant="success">PAGADO</Badge>
                                                )}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed">
                            Selecciona un apartamento para ver su estado de cuenta
                        </div>
                    )}
                </div>
            </div>

            {/* Create Bill Modal */}
            {showCreateBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold mb-4">Nueva Cuenta de Cobro</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Monto</label>
                                <input
                                    type="number" className="w-full p-2 border rounded"
                                    value={billData.amount}
                                    onChange={e => setBillData({ ...billData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Concepto</label>
                                <input
                                    className="w-full p-2 border rounded"
                                    placeholder="Ej: Administración Febrero"
                                    value={billData.description}
                                    onChange={e => setBillData({ ...billData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={billData.type}
                                    onChange={e => setBillData({ ...billData, type: e.target.value })}
                                >
                                    <option value="admin_fee">Administración</option>
                                    <option value="fine">Multa</option>
                                    <option value="extra">Extraordinaria</option>
                                    <option value="booking">Reserva</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fecha Límite</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded"
                                    value={billData.dueDate}
                                    onChange={e => setBillData({ ...billData, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="secondary" onClick={() => setShowCreateBill(false)}>Cancelar</Button>
                                <Button onClick={handleCreateBill}>Guardar</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
