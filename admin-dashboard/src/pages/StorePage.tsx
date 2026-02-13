
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Search, Trash2, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { ResidentSelect } from '../components/common/ResidentSelect';

// Interfaces
interface Product {
    id: number;
    name: string;
    sku: string;
    price: string; // Decimal string from backend
    current_stock: number;
    min_stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

// Subcomponents
const SalesHistory = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/store/stats').then(res => {
            setSales(res.data.recent_sales);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 text-center text-slate-500">Cargando facturas...</div>;

    return (
        <Table
            data={sales}
            columns={[
                { header: 'ID', accessor: 'id', className: 'w-16 font-mono text-slate-500' },
                {
                    header: 'Fecha',
                    accessor: (s) => new Date(s.created_at).toLocaleString(),
                    className: 'text-sm'
                },
                {
                    header: 'Cliente',
                    accessor: (s) => s.resident?.user?.full_name || 'N/A',
                    className: 'font-medium'
                },
                {
                    header: 'Total',
                    accessor: (s) => `$${Number(s.total).toFixed(2)}`,
                    className: 'font-bold text-slate-900'
                },
                {
                    header: 'Método',
                    accessor: (s) => (
                        <div className="flex items-center gap-2">
                            {s.payment_method === 'credit' ? '💳 Crédito' : '💵 Efectivo'}
                            {s.payment_status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                        </div>
                    )
                },
                {
                    header: 'Items',
                    accessor: (s) => s.items?.length + ' productos'
                }
            ]}
        />
    );
};

export const StorePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history'>('pos');
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedResident, setSelectedResident] = useState('');
    const [residents, setResidents] = useState<any[]>([]);


    // Shift State
    // const [shiftData, setShiftData] = useState<any>(null);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');

    // Inventory Form State - TODO: Implement create/edit
    // const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    // const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
        fetchResidents();
        fetchShiftStatus();
    }, []);

    const fetchShiftStatus = async () => {
        try {
            const res = await api.get('/store/shifts/status');
            setIsShiftOpen(res.data.isOpen);
            // setShiftData(res.data.shift);
        } catch (error) {
            console.error('Error checking shift status:', error);
        }
    }

    const handleOpenShift = async () => {
        const amount = prompt('Ingrese el monto base de la caja:', '0');
        if (amount === null) return;

        try {
            await api.post('/store/shifts/open', { initial_amount: amount });
            alert('Caja abierta correctamente');
            fetchShiftStatus();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al abrir caja');
        }
    };

    const handleCloseShift = async () => {
        const amount = prompt('Ingrese el monto final en caja (efectivo):', '0');
        if (amount === null) return;
        const notes = prompt('Notas de cierre (opcional):') || '';

        try {
            await api.post('/store/shifts/close', { final_amount: amount, notes });
            alert('Caja cerrada correctamente');
            fetchShiftStatus();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al cerrar caja');
        }
    };

    const fetchProducts = async () => {
        // ... existing fetchProducts ...

        try {
            const res = await api.get('/store/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {

        }
    };

    const fetchResidents = async () => {
        try {
            const res = await api.get('/residents');
            setResidents(res.data);
        } catch (error) {
            console.error('Error loading residents:', error);
        }
    };

    // POS Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.current_stock) {
                    alert('No hay suficiente stock disponible');
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                if (newQty > item.current_stock) {
                    alert('Stock máximo alcanzado');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);

    const handleCheckout = async () => {
        if (!selectedResident) return alert('Seleccione un residente');
        if (cart.length === 0) return alert('El carrito está vacío');

        if (!confirm(`¿Confirmar venta por $${cartTotal.toFixed(2)}?`)) return;

        try {
            await api.post('/store/sales', {
                resident_id: Number(selectedResident),
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                })),
                payment_method: paymentMethod
            });
            alert('Venta registrada exitosamente');
            setCart([]);
            setSelectedResident('');
            fetchProducts(); // Refresh stock
        } catch (error) {
            console.error(error);
            alert('Error al procesar la venta');
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tienda y Minibar</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500">Punto de venta e inventario</p>
                        <span className="text-slate-300">|</span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isShiftOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={isShiftOpen ? handleCloseShift : handleOpenShift}
                        >
                            {isShiftOpen ? 'Cerrar Caja' : 'Abrir Turno'}
                        </Button>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('pos')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pos' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={16} />
                            Punto de Venta
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'inventory' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Package size={16} />
                            Inventario
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} />
                            Facturas
                        </div>
                    </button>
                </div>
            </div>

            {activeTab === 'history' ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex-1 overflow-hidden flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Historial de Ventas</h2>
                    <SalesHistory />
                </div>
            ) : activeTab === 'pos' ? (
                <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* Catalog */}
                    <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-6">
                        <div className="mb-6 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map(product => (
                                <div key={product.id}
                                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${product.current_stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary-300'}`}
                                    onClick={() => product.current_stock > 0 && addToCart(product)}
                                >
                                    <div className="h-32 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                                        🥤
                                    </div>
                                    <h3 className="font-semibold text-slate-800 mb-1">{product.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-primary-600">${Number(product.price).toFixed(2)}</span>
                                        <Badge variant={product.current_stock > 10 ? 'success' : product.current_stock > 0 ? 'warning' : 'default'}>
                                            Stock: {product.current_stock}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="w-96 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-lg flex items-center gap-2">
                                <ShoppingCart className="text-primary-600" />
                                Carrito de Compra
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center text-slate-400 py-10">
                                    <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>Carrito vacío</p>
                                </div>
                            ) : cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-500">${Number(item.price).toFixed(2)} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-100">-</button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-100">+</button>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${paymentMethod === 'cash' ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                    >
                                        💵 Efectivo
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('credit')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${paymentMethod === 'credit' ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                    >
                                        💳 Crédito
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Cliente (Residente)</label>
                                <ResidentSelect
                                    residents={residents}
                                    value={selectedResident}
                                    onChange={setSelectedResident}
                                />
                            </div>

                            {!isShiftOpen && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-2 items-start">
                                    <div className="text-red-500 mt-0.5">⚠️</div>
                                    <p className="text-xs text-red-600">
                                        La caja está cerrada. Debe abrir un turno para realizar ventas.
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleCheckout}
                                className="w-full h-12 text-lg"
                                disabled={cart.length === 0 || !selectedResident || !isShiftOpen}
                            >
                                <CreditCard className="mr-2" />
                                {paymentMethod === 'credit' ? 'Registrar Crédito' : 'Cobrar Efectivo'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex-1">
                    <div className="flex justify-between mb-6">
                        <h2 className="text-lg font-semibold">Inventario de Productos</h2>
                        <Button icon={Plus} onClick={() => alert('Próximamente: Crear Producto')}>Nuevo Producto</Button>
                    </div>
                    <Table
                        data={products}
                        columns={[
                            { header: 'Producto', accessor: 'name', className: 'font-medium' },
                            { header: 'SKU', accessor: 'sku' },
                            { header: 'Precio', accessor: (p) => `$${Number(p.price).toFixed(2)}` },
                            {
                                header: 'Stock',
                                accessor: 'current_stock',
                                render: (val) => (
                                    <Badge variant={val > 10 ? 'success' : val > 0 ? 'warning' : 'error'}>
                                        {val} un.
                                    </Badge>
                                )
                            },
                        ]}
                    />
                </div>
            )}
        </div>
    );
};
