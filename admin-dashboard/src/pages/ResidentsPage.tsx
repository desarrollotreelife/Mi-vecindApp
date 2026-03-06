import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import { ResidentForm } from '../components/residents/ResidentForm';
import { RegistrationRequestsList } from '../components/residents/RegistrationRequestsList';
import { getImageUrl } from '../utils/imageHelper';

export const ResidentsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [residents, setResidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'rejected'>('active');

    const [selectedResident, setSelectedResident] = useState<any>(null);

    const fetchResidents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/residents');
            setResidents(response.data);
        } catch (error) {
            console.error('Error fetching residents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    const handleEdit = (resident: any) => {
        setSelectedResident(resident);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedResident(null);
    };



    // Filter logic
    const filteredResidents = residents.filter(r =>
        r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Residentes</h1>
                    <p className="text-slate-500">Gestiona el directorio de propietarios y arrendatarios.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" icon={RefreshCw} onClick={fetchResidents} />
                    <Button icon={Plus} onClick={() => { setSelectedResident(null); setIsFormOpen(true); }}>Nuevo Residente</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`py-3 px-5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Residentes Activos
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-3 px-5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Solicitudes Pendientes
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`py-3 px-5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'rejected' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Solicitudes Rechazadas
                </button>
            </div>

            {activeTab === 'active' ? (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, unidad o correo..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="secondary" icon={Filter}>Filtros</Button>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Cargando residentes...</div>
                    ) : (
                        <Table
                            data={filteredResidents}
                            columns={[
                                {
                                    header: 'Residente',
                                    render: (_, item) => (
                                        <div className="flex items-center gap-3">
                                            {item.profile_photo ? (
                                                <img
                                                    src={getImageUrl(item.profile_photo)}
                                                    alt={item.full_name}
                                                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + item.full_name;
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                    {item.full_name?.substring(0, 2).toUpperCase() || 'NA'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">{item.full_name}</div>
                                                <div className="text-xs text-slate-500">{item.email}</div>
                                            </div>
                                        </div>
                                    )
                                },
                                { header: 'Unidad', accessor: 'unit_number' },
                                { header: 'Teléfono', accessor: 'phone' },
                                {
                                    header: 'Rol',
                                    render: (_, item) => (
                                        <Badge variant={item.role === 'admin' ? 'warning' : 'info'}>
                                            {item.role === 'resident' ? 'Residente' : item.role === 'admin' ? 'Administrador' : item.role === 'guard' ? 'Guarda' : item.role}
                                        </Badge>
                                    )
                                },
                            ]}
                            actions={(item) => (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash size={16} />
                                    </button>
                                </div>
                            )}
                        />
                    )}
                </div>
            ) : (
                <RegistrationRequestsList status={activeTab as 'pending' | 'rejected'} />
            )}

            <ResidentForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSuccess={fetchResidents}
                initialData={selectedResident}
            />
        </div>
    );
};
