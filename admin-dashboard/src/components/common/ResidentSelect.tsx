import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, ChevronDown, User } from 'lucide-react';

interface Resident {
    id: number;
    full_name: string;
    unit_number?: string;
    unit?: {
        number: string;
        block?: string;
    };
}

interface ResidentSelectProps {
    residents: Resident[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

export const ResidentSelect: React.FC<ResidentSelectProps> = ({
    residents,
    value,
    onChange,
    placeholder = "Seleccione un residente...",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Find selected resident object
    const selectedResident = residents.find(r => r.id === Number(value));

    // Filter logic
    const filteredResidents = residents.filter(r => {
        const searchLower = search.toLowerCase();
        const nameMatch = r.full_name?.toLowerCase().includes(searchLower);

        let unitString = '';
        if (r.unit_number) {
            unitString = r.unit_number;
        } else if (r.unit) {
            unitString = r.unit.block ? `${r.unit.block} - ${r.unit.number}` : r.unit.number;
        }

        const unitMatch = unitString.toLowerCase().includes(searchLower);

        return nameMatch || unitMatch;
    });

    const getDisplayName = (r: Resident) => {
        let unitString = '';
        if (r.unit_number) {
            unitString = r.unit_number;
        } else if (r.unit) {
            unitString = r.unit.block ? `${r.unit.block}-${r.unit.number}` : r.unit.number;
        }
        return `${unitString} - ${r.full_name}`;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className={`w-full px-4 py-2 rounded-lg border flex items-center justify-between cursor-pointer bg-white transition-all ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <User size={18} className="text-slate-400 shrink-0" />
                    <span className={`truncate ${selectedResident ? 'text-slate-900' : 'text-slate-500'}`}>
                        {selectedResident ? getDisplayName(selectedResident) : placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Hidden Input for HTML5 Validation */}
            <input
                type="text"
                className="sr-only"
                required={required}
                value={value || ''}
                onChange={() => { }}
                onFocus={() => setIsOpen(true)}
            />

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50 sticky top-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
                                placeholder="Buscar por nombre o apto..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredResidents.length > 0 ? (
                            filteredResidents.map(resident => (
                                <div
                                    key={resident.id}
                                    className={`px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition-colors ${resident.id === Number(value)
                                            ? 'bg-primary-50 text-primary-900'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    onClick={() => {
                                        onChange(resident.id.toString());
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span>{getDisplayName(resident)}</span>
                                    {resident.id === Number(value) && <Check size={14} className="text-primary-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-slate-400">
                                No se encontraron residentes
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
