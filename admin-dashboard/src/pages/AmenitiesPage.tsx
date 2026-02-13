import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Clock, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table'; // Reusing Table for bookings list if needed
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { BookingForm } from '../components/amenities/BookingForm';

export const AmenitiesPage: React.FC = () => {
    const { user } = useAuth();
    const [amenities, setAmenities] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAmenityId, setSelectedAmenityId] = useState<number | undefined>(undefined);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [amenRes, bookRes] = await Promise.all([
                api.get('/amenities'),
                api.get('/amenities/bookings')
            ]);
            setAmenities(amenRes.data);
            setBookings(bookRes.data);
        } catch (error) {
            console.error('Error fetching amenities data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBookClick = (amenityId: number) => {
        setSelectedAmenityId(amenityId);
        setIsFormOpen(true);
    };

    const handleNewBooking = () => {
        setSelectedAmenityId(undefined);
        setIsFormOpen(true);
    };

    const handleAction = async (bookingId: number, action: 'approve' | 'reject') => {
        try {
            await api.post(`/amenities/bookings/${bookingId}/${action}`);
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error(`Error ${action} booking:`, error);
            alert(error.response?.data?.error || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Amenidades y Reservas</h1>
                    <p className="text-slate-500">Gestión de áreas comunes y calendario.</p>
                </div>
                <Button icon={Plus} onClick={handleNewBooking}>Nueva Reserva</Button>
            </div>

            {/* Amenities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {amenities.map(amenity => (
                    <div key={amenity.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                        <div className="h-40 bg-slate-100 relative">
                            {/* Placeholder pattern/image */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20 flex items-center justify-center">
                                <Users size={48} className="text-primary-200 group-hover:text-primary-300 transition-colors" />
                            </div>
                            <div className="absolute bottom-3 right-3">
                                <Badge variant={amenity.status === 'maintenance' ? 'error' : 'success'}>
                                    {amenity.status === 'maintenance' ? 'Mantenimiento' : 'Disponible'}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{amenity.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{amenity.description || 'Zona común disponible para residentes.'}</p>

                            <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span>08:00 - 22:00</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={16} />
                                    <span>Cap: 20</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleBookClick(amenity.id)}
                                    disabled={amenity.status === 'maintenance'}
                                >
                                    {amenity.status === 'maintenance' ? 'No disponible' : 'Reservar Ahora'}
                                </Button>

                                {/* Admin Maintenance Toggle */}
                                {['admin', 'super-admin'].includes(typeof user?.role === 'string' ? user.role : user?.role?.name || '') && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm('¿Cambiar estado de mantenimiento?')) return;
                                            try {
                                                const newStatus = amenity.status === 'maintenance' ? 'active' : 'maintenance';
                                                await api.put(`/amenities/${amenity.id}`, { status: newStatus });
                                                fetchData();
                                            } catch (err: any) {
                                                alert('Error: ' + (err.response?.data?.error || err.message));
                                            }
                                        }}
                                        className="text-xs text-slate-400 hover:text-red-500 flex items-center justify-center gap-1 mt-1 p-1"
                                    >
                                        <Settings size={12} />
                                        {amenity.status === 'maintenance' ? 'Reactivar Amenidad' : 'Poner en Mantenimiento'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Bookings List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-primary-600" />
                        Próximas Reservas
                    </h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando reservas...</div>
                ) : (
                    <Table
                        data={bookings}
                        columns={[
                            { header: 'Amenidad', accessor: 'amenity.name', className: 'font-medium' },
                            { header: 'Residente', accessor: 'user.full_name' },
                            {
                                header: 'Fecha',
                                accessor: (b) => new Date(b.start_time).toLocaleDateString()
                            },
                            {
                                header: 'Horario',
                                accessor: (b) => `${new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            },
                            {
                                header: 'Estado',
                                accessor: (b) => (
                                    <Badge variant={b.status === 'approved' ? 'success' : b.status === 'pending' ? 'warning' : 'error'}>
                                        {b.status === 'approved' ? 'Aprobada' : b.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                                    </Badge>
                                )
                            },
                            {
                                header: 'Acciones',
                                accessor: (b) => (
                                    b.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(b.id, 'approve')}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded"
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleAction(b.id, 'reject')}
                                                className="text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )
                                )
                            }
                        ]}
                    />
                )}
            </div>

            <BookingForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchData}
                amenityId={selectedAmenityId}
            />
        </div>
    );
};
