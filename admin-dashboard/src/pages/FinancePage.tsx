import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export const FinancePage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'maintenance'
    });

    const fetchFinance = async () => {
        try {
            const [summaryRes, expensesRes] = await Promise.all([
                api.get('/finance/summary'),
                api.get('/finance/expenses')
            ]);
            setData(summaryRes.data);
            setExpenses(expensesRes.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinance();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/finance/expenses', formData);
            setShowModal(false);
            setFormData({ amount: '', description: '', category: 'maintenance' });
            fetchFinance();
        } catch (error) {
            alert('Error al registrar gasto');
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) return <div>Cargando finanzas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Finanzas y Tesorería</h1>
                    <p className="text-slate-500">Resumen ejecutivo del conjunto</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><FileText size={18} className="mr-2" /> Reportes</Button>
                    <Button onClick={() => setShowModal(true)}><Plus size={18} className="mr-2" /> Registrar Gasto</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-full text-green-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Ingresos Totales (Mes)</p>
                            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(data?.income.total)}</h3>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Pendiente por cobrar: <span className="text-orange-500 font-medium">{formatCurrency(data?.income.pending)}</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 rounded-full text-red-600">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Gastos Totales (Mes)</p>
                            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(data?.expenses.total)}</h3>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Presupuesto: <span className="text-slate-700 font-medium">{formatCurrency(data?.expenses.budget)}</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Fondo de Imprevistos</p>
                            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(data?.reserve_fund.total)}</h3>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Estado saludable (Cobertura 100%)
                    </div>
                </Card>
            </div>

            {/* Expenses List */}
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">Historial de Gastos</h2>
            <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Descripción</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                    No hay gastos registrados este mes.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense: any) => (
                                <tr key={expense.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-600">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-900">
                                        {expense.description}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 capitalize">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-red-600 font-medium">
                                        - {formatCurrency(Number(expense.amount))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Registrar Nuevo Gasto</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Reparación tubería"
                                    className="w-full border rounded p-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Categoría</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="maintenance">Mantenimiento</option>
                                    <option value="services">Servicios Públicos</option>
                                    <option value="payroll">Nómina / Honorarios</option>
                                    <option value="supplies">Insumos</option>
                                    <option value="other">Otros</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Gasto</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
