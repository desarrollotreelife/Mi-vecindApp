import React, { useState, useEffect } from 'react';
import { Dog, Plus, Clock, ShieldCheck, Camera, ScrollText } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Pet {
    id: number;
    name: string;
    type: string;
    breed?: string;
    photo_url?: string;
    vaccines_updated: boolean;
    description?: string;
}

export const ResidentPetsPage: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '',
        type: 'dog',
        breed: '',
        photo_url: '',
        vaccines_updated: false,
        description: ''
    });

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const res = await api.get('/residents/pets');
            setPets(res.data);
        } catch (error) {
            console.error('Error fetching pets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/residents/pets', formData);
            setShowForm(false);
            setFormData({
                name: '', type: 'dog', breed: '', photo_url: '', vaccines_updated: false, description: ''
            });
            fetchPets();
        } catch (error) {
            alert('Error al registrar mascota');
        }
    };

    if (loading) return <div className="p-6 text-center text-slate-500">Cargando...</div>;

    return (
        <div className={`p-6 max-w-4xl mx-auto ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black font-outfit flex items-center gap-3">
                    <Dog className="text-orange-500" size={32} />
                    Mis Mascotas (Pet ID)
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Registrar Mascota
                </button>
            </div>

            {showForm && (
                <div className={`mb-8 p-6 rounded-2xl border backdrop-blur-md ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-200 shadow-xl'}`}>
                    <h2 className="text-xl font-bold mb-4 font-outfit text-slate-800 dark:text-white">Nuevo Registro</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <option value="dog">Perro</option>
                                <option value="cat">Gato</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Raza</label>
                            <input
                                value={formData.breed}
                                onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">URL Foto (Opcional)</label>
                            <input
                                value={formData.photo_url}
                                onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                                placeholder="https://..."
                                className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rasgos Físicos / Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full p-2.5 rounded-xl border outline-none resize-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                        <div className="col-span-2 flex justify-between items-center mt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.vaccines_updated}
                                    onChange={e => setFormData({ ...formData, vaccines_updated: e.target.checked })}
                                    className="w-5 h-5 accent-emerald-500 rounded"
                                />
                                <span className="font-bold text-sm">Vacunas al Día (Carnet Verificado)</span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                >
                                    Guardar Pet ID
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map(pet => (
                    <div key={pet.id} className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            {pet.vaccines_updated ? (
                                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <ShieldCheck size={12} />
                                    Saludable
                                </span>
                            ) : (
                                <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <Clock size={12} />
                                    Sin Vacunar
                                </span>
                            )}
                        </div>

                        {/* Image Header */}
                        <div className="h-48 relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                            {pet.photo_url ? (
                                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <Dog size={64} className="text-slate-300 dark:text-slate-700" />
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="p-5 relative">
                            {/* Floaty Name */}
                            <div className="absolute -top-10 left-5">
                                <h3 className="text-2xl font-black font-outfit text-white drop-shadow-md">{pet.name}</h3>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{pet.breed || 'Mestizo'} • {pet.type === 'dog' ? 'Perro' : pet.type === 'cat' ? 'Gato' : 'Otro'}</p>
                            </div>

                            <div className="mt-4 space-y-3">
                                {pet.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                        "{pet.description}"
                                    </p>
                                )}
                                <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Pet ID Card</span>
                                    <button className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors">
                                        <ScrollText size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {pets.length === 0 && !showForm && (
                    <div className={`col-span-full p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-4">
                            <Camera size={32} />
                        </div>
                        <h3 className="text-xl font-bold font-outfit mb-2">Aún no tienes mascotas</h3>
                        <p className="text-slate-500 text-sm max-w-sm mb-6">Registra a tus peludos para identificarlos rápidamente en caso de pérdida dentro del conjunto.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-orange-600/30 transition-all"
                        >
                            Registrar mi Mascota
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
