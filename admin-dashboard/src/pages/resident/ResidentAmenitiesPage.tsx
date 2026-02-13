import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckCircle, XCircle, Clock as ClockIcon, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ResidentAmenitiesPage: React.FC = () => {
    const { user } = useAuth();
    const [amenities, setAmenities] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [guests, setGuests] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [amenRes, bookRes] = await Promise.all([
                api.get('/amenities'),
                api.get('/bookings?status=pending') // TODO: Need 'my bookings' endpoint or filter by user in frontend for MVP
            ]);
            setAmenities(amenRes.data);

            // Temporary: Filter my bookings from the general list (Backend should support /my-bookings)
            // For MVP assuming the list returns everything or we filter what we can see
            // Better approach: Let's assume listBookings returns all and we filter by our ID if the backend doesn't filter
            // But wait, the previous listBookings implementation in backend didn't filter by user. 
            // We should use the generic list and filter here for MVP or add userId filter to backend.
            // Let's rely on finding our user's bookings.
            // Since we don't have a specific endpoint, let's just make a generic call and filter.
            const allBookings = await api.get('/bookings');
            const mine = allBookings.data.filter((b: any) => b.user_id === user?.id);
            setMyBookings(mine);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenBook = (amenity: any) => {
        setSelectedAmenity(amenity);
        setDate('');
        setStartTime('');
        setEndTime('');
        setIsModalOpen(true);
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const startDateTime = new Date(`${date}T${startTime}`).toISOString();
            const endDateTime = new Date(`${date}T${endTime}`).toISOString();

            await api.post('/amenities/book', {
                amenity_id: selectedAmenity.id,
                user_id: user.id,
                start_time: startDateTime,
                end_time: endDateTime,
                guest_count: Number(guests)
            });

            setIsModalOpen(false);
            alert('¡Solicitud enviada! Queda pendiente de aprobación.');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al reservar.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Reservar Zonas Comunes</h1>
                <p className="text-slate-500">Solicita el uso de espacios compartidos.</p>
            </div>

            {/* Amenities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amenities.map(amenity => (
                    <Card key={amenity.id} className="p-0 overflow-hidden flex flex-col">
                        <div className="h-32 bg-slate-100 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                            <Users size={40} className="text-emerald-300" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800">{amenity.name}</h3>
                                <Badge variant={amenity.status === 'available' ? 'success' : 'error'}>
                                    {amenity.status === 'available' ? 'Disponible' : 'Mtto'}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{amenity.description}</p>

                            <div className="mt-auto">
                                <Button className="w-full" onClick={() => handleOpenBook(amenity)} disabled={amenity.status !== 'available'}>
                                    Solicitar Reserva
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* My Bookings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Mis Solicitudes
                </h3>
                {loading ? (
                    <div className="text-center py-4 text-slate-400">Cargando...</div>
                ) : myBookings.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No tienes reservas activas.</p>
                ) : (
                    <div className="space-y-3">
                        {myBookings.map(booking => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{booking.amenity?.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(booking.start_time).toLocaleDateString()} | {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div>
                                    {booking.status === 'approved' && <Badge variant="success">Aprobada</Badge>}
                                    {booking.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                                    {booking.status === 'rejected' && <Badge variant="error">Rechazada</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Reservar {selectedAmenity?.name}</h3>
                            <button onClick={() => setIsModalOpen(false)}><XCircle className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleBook} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                                <input type="date" required className="w-full border rounded p-2" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Inicio</label>
                                    <input type="time" required className="w-full border rounded p-2" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Fin</label>
                                    <input type="time" required className="w-full border rounded p-2" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Invitados (aprox)</label>
                                <input type="number" min="1" max={selectedAmenity?.capacity || 20} className="w-full border rounded p-2" value={guests} onChange={e => setGuests(Number(e.target.value))} />
                            </div>
                            <Button className="w-full mt-2">Enviar Solicitud</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
