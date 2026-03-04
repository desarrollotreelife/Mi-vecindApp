import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html, Text, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import clsx from 'clsx';
import { Settings, X, Check, Info, RotateCw, Move, Plus, Trash2, Layers, Moon, Sun } from 'lucide-react';
import { Sky } from '@react-three/drei';
import api from '../../services/api';

interface Unit3D {
    id: number;
    number: string;
    floor: number;
    residents?: any[];
}

interface ParkingSlot3D {
    id: number;
    code: string;
    floor: number;
    type: 'resident' | 'visitor';
    is_occupied: boolean;
    unit?: Unit3D;
}

interface BuildingProps {
    blockName: string;
    units: Unit3D[];
    position: [number, number, number];
    onSelectUnit: (unit: Unit3D) => void;
    designMode?: boolean;
    selectedFloor?: number | null;
    onMove?: (newPos: [number, number, number]) => void;
}

const UnitBox: React.FC<{
    unit: Unit3D;
    position: [number, number, number];
    onSelect: () => void;
    isSelected: boolean;
    isInEmergency: boolean;
}> = ({ unit, position, onSelect, isSelected, isInEmergency }) => {
    const [hovered, setHovered] = useState(false);
    const hasResidents = unit.residents && unit.residents.length > 0;

    // Colors: Green for occupied, White for empty, Blue for selected
    const baseColor = hasResidents ? '#22c55e' : '#f8fafc';
    let color = isSelected ? '#4f46e5' : hovered ? '#818cf8' : baseColor;

    // In emergency, make it red
    if (isInEmergency) color = '#dc2626';

    return (
        <group position={position}>
            {/* Pulsing Emergency Ring */}
            {isInEmergency && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]}>
                    <ringGeometry args={[0.6, 0.8, 32]} />
                    <meshStandardMaterial color="#ef4444" transparent opacity={0.6} emissive="#ef4444" emissiveIntensity={2} />
                    <EmergencyPulse />
                </mesh>
            )}

            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[0.9, 0.5, 0.9]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.2}
                    emissive={isInEmergency ? '#ef4444' : isSelected ? '#4f46e5' : '#000000'}
                    emissiveIntensity={isInEmergency ? 0.5 : isSelected ? 0.2 : 0}
                />
                {(hovered || isInEmergency) && (
                    <Html distanceFactor={10}>
                        <div className={clsx(
                            "px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-xl pointer-events-none border animate-in fade-in zoom-in duration-200",
                            isInEmergency
                                ? "bg-red-600 text-white border-red-400 font-bold scale-110 shadow-red-500/50"
                                : "bg-slate-900/90 text-white border-slate-700"
                        )}>
                            {isInEmergency && <span className="mr-1">🚨</span>}
                            Apto {unit.number}
                        </div>
                    </Html>
                )}
            </mesh>
        </group>
    );
};

const EmergencyPulse: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const s = 1 + Math.sin(clock.getElapsedTime() * 10) * 0.2;
        meshRef.current.scale.set(s, s, s);
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 32]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.4} />
        </mesh>
    );
};

const Building: React.FC<BuildingProps & { alertUnits: Set<number> }> = ({
    blockName, units, position, onSelectUnit, alertUnits, designMode, selectedFloor
}) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const floors = [...new Set(units.map(u => u.floor))].sort((a, b) => a - b);

    return (
        <group position={position}>
            {/* Label for the building */}
            <Text
                position={[0, (floors.length * 0.6) + 0.5, 0]}
                fontSize={0.4}
                color="#1e293b"
                anchorX="center"
                anchorY="middle"
            >
                {blockName}
            </Text>

            {/* Structure Boxes */}
            {units.map((unit) => {
                const floorUnits = units.filter(u => u.floor === unit.floor);
                const unitIdx = floorUnits.indexOf(unit);
                const xPos = (unitIdx - (floorUnits.length - 1) / 2) * 1.1;
                const yPos = (unit.floor - 1) * 0.6;

                // Simple filter logic: if a floor is selected, other floors become semi-transparent
                const isVisible = selectedFloor === null || selectedFloor === undefined || unit.floor === selectedFloor;

                if (!isVisible && selectedFloor !== null) return null;

                return (
                    <UnitBox
                        key={unit.id}
                        unit={unit}
                        position={[xPos, yPos, 0]}
                        isSelected={selectedId === unit.id}
                        isInEmergency={alertUnits.has(unit.id)}
                        onSelect={() => {
                            if (designMode) return;
                            setSelectedId(unit.id);
                            onSelectUnit(unit);
                        }}
                    />
                );
            })}

            {/* Foundation / Floor */}
            <mesh position={[0, -0.45, 0]}>
                <boxGeometry args={[7, 0.1, 3]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
        </group>
    );
};

const ParkingSlotBox: React.FC<{
    slot: ParkingSlot3D;
    position: [number, number, number];
    isSelected: boolean;
    onSelect: () => void;
}> = ({ slot, position, isSelected, onSelect }) => {
    const [hovered, setHovered] = useState(false);

    // Status colors
    const color = isSelected ? '#4f46e5' :
        slot.is_occupied ? '#ef4444' :
            slot.type === 'visitor' ? '#fde047' : '#22c55e';

    return (
        <group position={position}>
            <mesh
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[1.2, 0.1, 2.5]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.4}
                    metalness={0.1}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* White lines marking the slot */}
            <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[1.1, 0.01, 2.4]} />
                <meshStandardMaterial color="white" transparent opacity={0.3} />
            </mesh>

            {(hovered || isSelected) && (
                <Html distanceFactor={8}>
                    <div className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap border border-slate-700 shadow-xl pointer-events-none">
                        <div className="font-bold">Celda {slot.code}</div>
                        <div className="opacity-70 text-[8px]">
                            {slot.type === 'resident' ? `Apto ${slot.unit?.number || '?'}` : 'Visitate'}
                            {' - '}
                            {slot.is_occupied ? 'Ocupado' : 'Libre'}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

const ParkingLot: React.FC<{
    slots: ParkingSlot3D[];
    position: [number, number, number];
    selectedFloor: number | null;
    onSelectSlot: (slot: ParkingSlot3D) => void;
}> = ({ slots, position, selectedFloor, onSelectSlot }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    return (
        <group position={position}>
            <Text
                position={[0, 1.5, 0]}
                fontSize={0.5}
                color="#1e293b"
                anchorX="center"
            >
                PARQUEADERO
            </Text>

            {slots.map((slot) => {
                // Filter by floor
                if (selectedFloor !== null && slot.floor !== selectedFloor) return null;

                const floorSlots = slots.filter(s => s.floor === slot.floor);
                const slotIdx = floorSlots.indexOf(slot);

                // Grid layout for slots: 10 per row
                const xPos = (slotIdx % 10 - 4.5) * 1.5;
                const zPos = Math.floor(slotIdx / 10) * 3;
                const yPos = (slot.floor - 1) * 2; // Elevate between floors if multi-floor

                return (
                    <ParkingSlotBox
                        key={slot.id}
                        slot={slot}
                        position={[xPos, yPos, zPos]}
                        isSelected={selectedId === slot.id}
                        onSelect={() => {
                            setSelectedId(slot.id);
                            onSelectSlot(slot);
                        }}
                    />
                );
            })}

            {/* Parking Base */}
            <mesh position={[0, -0.45, 5]} receiveShadow>
                <boxGeometry args={[16, 0.1, 12]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
};

const ParkingManagementPanel: React.FC<{
    slots: ParkingSlot3D[];
    onClose: () => void;
    onRefresh: () => void;
}> = ({ slots, onClose, onRefresh }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [loading, setLoading] = useState(false);

    // Bulk create state
    const [prefix, setPrefix] = useState('P-');
    const [start, setStart] = useState(1);
    const [end, setEnd] = useState(10);
    const [floor, setFloor] = useState(1);
    const [type, setType] = useState('resident');

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/parking/slots/bulk', {
                prefix, start, end, floor, type,
                complexId: 1 // Default for now, should come from context
            });
            onRefresh();
            setView('list');
        } catch (error) {
            alert('Error al crear celdas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta celda?')) return;
        setLoading(true);
        try {
            await api.delete(`/parking/slots/${id}`);
            onRefresh();
        } catch (error) {
            alert('Error al eliminar celda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute top-4 right-16 z-30 w-80 bg-white/95 backdrop-blur-md shadow-2xl border rounded-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    Gestión de Celdas
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <X size={18} />
                </button>
            </div>

            <div className="flex p-1 bg-slate-100 m-4 rounded-lg">
                <button
                    onClick={() => setView('list')}
                    className={clsx(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                        view === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Lista ({slots.length})
                </button>
                <button
                    onClick={() => setView('create')}
                    className={clsx(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                        view === 'create' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    + Crear Bloque
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {view === 'list' ? (
                    <div className="space-y-2">
                        {slots.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xs text-slate-400 italic">No hay celdas creadas</p>
                            </div>
                        ) : (
                            slots.sort((a, b) => a.code.localeCompare(b.code)).map(slot => (
                                <div key={slot.id} className="group flex items-center justify-between p-2 rounded-lg border bg-white hover:border-indigo-200 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{slot.code}</span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-tighter font-medium">
                                            Piso {slot.floor} • {slot.type === 'resident' ? 'Residente' : 'Visitante'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(slot.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleBulkCreate} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Prefijo</label>
                                <input
                                    value={prefix} onChange={e => setPrefix(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:ring-2 ring-indigo-500/20 outline-none"
                                    placeholder="Ej: A-"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Piso</label>
                                <input
                                    type="number" value={floor} onChange={e => setFloor(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Desde #</label>
                                <input
                                    type="number" value={start} onChange={e => setStart(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Hasta #</label>
                                <input
                                    type="number" value={end} onChange={e => setEnd(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tipo de Celda</label>
                            <div className="flex gap-2">
                                {['resident', 'visitor'].map(t => (
                                    <button
                                        key={t} type="button"
                                        onClick={() => setType(t)}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all capitalized",
                                            type === t ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        {t === 'resident' ? 'Residente' : 'Visitante'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <RotateCw size={14} className="animate-spin" /> : <Plus size={14} />}
                            Crear {end - start + 1} Celdas
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const CommonArea: React.FC<{
    name: string;
    position: [number, number, number];
    args: [number, number, number];
    color?: string;
    designMode?: boolean;
}> = ({ name, position, args, color = '#cbd5e1' }) => (
    <group position={position}>
        <Text
            position={[0, args[1] - 0.2, 0]}
            fontSize={0.4}
            color="#334155"
            anchorX="center"
            anchorY="bottom"
            fontStyle="italic"
        >
            {name}
        </Text>
        <mesh castShadow receiveShadow position={[0, args[1] / 2 - 0.5, 0]}>
            <boxGeometry args={args} />
            <meshStandardMaterial
                color={color}
                roughness={0.6}
                metalness={0.2}
            />
        </mesh>
        {/* Subtle base plate for a more professional "architectural" look */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
            <planeGeometry args={[args[0] + 1, args[2] + 1]} />
            <meshStandardMaterial color={color} transparent opacity={0.15} />
        </mesh>
    </group>
);

const SimpleTree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={[scale, scale, scale]}>
        {/* Trunk */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* Leaves - layered spheres for a nice low-poly look */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.7, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
        <mesh position={[0.3, 1.0, 0.3]} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
        <mesh position={[-0.3, 1.0, -0.3]} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
    </group>
);

// Default positions for common areas - Grouped within the "Social Zone" rectangle
const SOCIAL_ZONE_POS: [number, number, number] = [0, 0, 5];
const SOCIAL_ZONE_ARGS: [number, number, number] = [18, 0.1, 8];

const COMMON_AREAS_DEFAULTS: Record<string, [number, number, number]> = {
    'Salón Social': [-4, 0, 4],
    'BBQ': [-4, 0, 7],
    'Parque Niños': [4, 0, 4],
    'Cancha': [4, 0, 7],
};

const SocialZone = () => (
    <group position={SOCIAL_ZONE_POS}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.49, 0]}>
            <planeGeometry args={[SOCIAL_ZONE_ARGS[0], SOCIAL_ZONE_ARGS[2]]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.1} />
        </mesh>
        <Text
            position={[0, -0.45, SOCIAL_ZONE_ARGS[2] / 2 + 1]}
            fontSize={1.2}
            color="#10b981"
            rotation={[-Math.PI / 2, 0, 0]}
            fontStyle="italic"
            anchorX="center"
            fillOpacity={0.3}
        >
            ZONA SOCIAL
        </Text>
    </group>
);

// Helper to generate some random trees around the borders
const decorativeTrees = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    position: [
        (Math.random() - 0.5) * 80,
        -0.5,
        (Math.random() - 0.5) * 60 - 15  // Bias towards the back
    ] as [number, number, number],
    scale: 0.8 + Math.random() * 0.6
})).filter(t => Math.abs(t.position[0]) > 25 || t.position[2] < -20); // Keep center clear

// Helper to get a default position if none is saved
const getDefaultPosition = (name: string, index: number): [number, number, number] => {
    if (COMMON_AREAS_DEFAULTS[name]) return COMMON_AREAS_DEFAULTS[name];
    if (name === 'Parqueadero') return [15, 0, 5];
    // Line up towers along Z = -5 with better spacing
    return [-15 + (index * 6), 0, -5];
};

// Component to handle individual draggable objects in design mode
const DraggableObject: React.FC<{
    name: string;
    position: [number, number, number];
    isActive: boolean;
    onSelect: () => void;
    onMove: (newPos: THREE.Vector3) => void;
    children: React.ReactNode;
}> = ({ position, isActive, onSelect, onMove, children }) => {
    const ref = useRef<THREE.Group>(null!);

    return (
        <group
            ref={ref}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {children}
            {isActive && (
                <TransformControls
                    object={ref}
                    mode="translate"
                    showY={false}
                    onMouseUp={(e: any) => onMove(e.target.object.position)}
                    makeDefault
                />
            )}
        </group>
    );
};

export const BuildingExplorer3D: React.FC<{
    structure: Record<string, Unit3D[]>;
    onSelectUnit: (unit: Unit3D) => void;
    alertUnits: Set<number>;
}> = ({ structure, onSelectUnit, alertUnits }) => {
    const [designMode, setDesignMode] = useState(false);
    const [selectedObject, setSelectedObject] = useState<string | null>(null);
    const [layout, setLayout] = useState<Record<string, [number, number, number]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [parkingSlots, setParkingSlots] = useState<ParkingSlot3D[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
    const [showParkingMgmt, setShowParkingMgmt] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    const blocks = Object.entries(structure);

    const [isNightMode, setIsNightMode] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Layout
                const layoutRes = await api.get('/config/layout-config');
                if (layoutRes.data) setLayout(layoutRes.data);

                // Fetch Parking
                const parkingRes = await api.get('/parking/status');
                if (parkingRes.data?.slots) setParkingSlots(parkingRes.data.slots);
            } catch (error) {
                console.warn('Could not fetch initial 3D data');
            }
        };
        fetchInitialData();
    }, []);

    const resetToDefaults = () => {
        if (confirm('¿Restablecer todas las posiciones a los valores predeterminados?')) {
            const defaults: Record<string, [number, number, number]> = {};

            // Towers
            blocks.forEach(([name], idx) => {
                defaults[name] = getDefaultPosition(name, idx);
            });

            // Common Areas
            Object.keys(COMMON_AREAS_DEFAULTS).forEach(name => {
                defaults[name] = COMMON_AREAS_DEFAULTS[name];
            });

            // Parking Lot
            defaults['Parqueadero'] = getDefaultPosition('Parqueadero', 0);

            setLayout(defaults);
            setSelectedObject(null);
        }
    };

    const handleSaveLayout = async () => {
        setIsSaving(true);
        try {
            await api.put('/config/layout-config', layout);
            alert('Diseño guardado correctamente');
            setDesignMode(false);
            setSelectedObject(null);
        } catch (error) {
            alert('Error al guardar el diseño');
        } finally {
            setIsSaving(false);
        }
    };

    const fetchParking = async () => {
        try {
            const parkingRes = await api.get('/parking/status');
            if (parkingRes.data?.slots) setParkingSlots(parkingRes.data.slots);
        } catch (error) {
            console.warn('Could not fetch parking data');
        }
    };

    const handleObjectMove = (name: string, newPos: THREE.Vector3) => {
        setLayout(prev => ({
            ...prev,
            [name]: [newPos.x, 0, newPos.z]
        }));
    };

    const allFloors = [...new Set([
        ...blocks.flatMap(([_, units]) => units.map(u => u.floor)),
        ...parkingSlots.map(s => s.floor)
    ])].sort((a, b) => (a || 0) - (b || 0));

    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden">


            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowSettingsMenu(!showSettingsMenu);
                            setShowParkingMgmt(false);
                        }}
                        className={clsx(
                            "p-2 rounded-full shadow-lg transition-all flex items-center justify-center backdrop-blur-md",
                            showSettingsMenu ? "bg-slate-800 text-white" : "bg-white/80 text-slate-900 border hover:bg-white"
                        )}
                    >
                        <Settings size={20} className={clsx(showSettingsMenu && "animate-spin-slow")} />
                    </button>

                    {showSettingsMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white/fafc backdrop-blur-xl shadow-2xl border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5">
                            {/* Section: Floor Filters */}
                            <div className="p-3 border-b bg-slate-50/50">
                                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                    <Layers size={12} className="text-indigo-500" />
                                    <span>Filtrar por Piso</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    <button
                                        onClick={() => setSelectedFloor(null)}
                                        className={clsx(
                                            "px-2 py-1.5 rounded text-[10px] font-bold transition-all border",
                                            selectedFloor === null
                                                ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                                : "bg-white text-slate-600 hover:bg-slate-50 border-slate-100"
                                        )}
                                    >
                                        Todos
                                    </button>
                                    {allFloors.map((floor: number | null) => (
                                        <button
                                            key={floor ?? 'all'}
                                            onClick={() => setSelectedFloor(floor)}
                                            className={clsx(
                                                "px-2 py-1.5 rounded text-[10px] font-bold transition-all border",
                                                selectedFloor === floor
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                                    : "bg-white text-slate-600 hover:bg-slate-50 border-slate-100"
                                            )}
                                        >
                                            P{floor}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Legend */}
                            <div className="p-3 border-b">
                                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                    <Info size={12} className="text-indigo-500" />
                                    <span>Leyenda Visual</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 bg-[#22c55e] border border-green-600/20 rounded-sm"></div>
                                        <span className="text-slate-600 font-medium">Ocupado</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 bg-[#f8fafc] border border-slate-200 rounded-sm"></div>
                                        <span className="text-slate-600 font-medium">Disponible</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 bg-[#4f46e5] border border-indigo-600/20 rounded-sm"></div>
                                        <span className="text-slate-600 font-medium">Seleccionado</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                        </div>
                                        <span className="text-red-600 font-bold">¡S.O.S!</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Actions */}
                            <div className="p-1">
                                <button
                                    onClick={() => {
                                        setDesignMode(!designMode);
                                        setSelectedObject(null);
                                        setShowSettingsMenu(false);
                                    }}
                                    className={clsx(
                                        "w-full px-3 py-2 text-[11px] font-bold flex items-center gap-3 transition-colors rounded-lg",
                                        designMode ? "bg-red-50 text-red-600 hover:bg-red-100" : "hover:bg-slate-50 text-slate-700"
                                    )}
                                >
                                    {designMode ? <X size={14} /> : <Move size={14} />}
                                    {designMode ? 'Salir Modo Diseño' : 'Acomodar Diseño'}
                                </button>

                                <button
                                    onClick={() => {
                                        setIsNightMode(!isNightMode);
                                        setShowSettingsMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    {isNightMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-400" />}
                                    {isNightMode ? 'Modo Día' : 'Modo Noche'}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowParkingMgmt(true);
                                        setShowSettingsMenu(false);
                                        setDesignMode(false);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    <Plus size={14} className="text-indigo-600" />
                                    Gestionar Celdas
                                </button>

                                <button
                                    onClick={() => {
                                        resetToDefaults();
                                        setShowSettingsMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    <RotateCw size={14} className="text-slate-500" />
                                    Restablecer Posiciones
                                </button>

                                {designMode && (
                                    <button
                                        onClick={handleSaveLayout}
                                        disabled={isSaving}
                                        className="w-full px-3 py-2.5 mt-1 bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-200"
                                    >
                                        <Check size={14} />
                                        {isSaving ? 'Guardando...' : 'Guardar Diseño'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Parking Management Panel */}
            {showParkingMgmt && (
                <ParkingManagementPanel
                    slots={parkingSlots}
                    onClose={() => setShowParkingMgmt(false)}
                    onRefresh={fetchParking}
                />
            )}

            {designMode && (
                <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg border shadow-sm max-w-xs transition-all animate-in slide-in-from-bottom duration-300">
                    <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                        <Info size={14} className="text-indigo-600" /> Modo de Diseño Activo
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                        Haz clic en una torre o zona común para seleccionarla. Usa las flechas para moverla. Solo puedes mover en el plano horizontal (X y Z).
                    </p>
                </div>
            )}

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[20, 20, 25]} fov={35} />
                <OrbitControls
                    enableDamping
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1}
                    maxDistance={100}
                    enabled={!selectedObject}
                    makeDefault
                />

                {/* Iluminación y Cielo según Modo Día/Noche */}
                {isNightMode ? (
                    <>
                        <ambientLight intensity={0.1} color="#4338ca" />
                        <directionalLight position={[10, 20, 10]} intensity={0.2} color="#818cf8" castShadow shadow-mapSize={[2048, 2048]} />
                        <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0.8} azimuth={0.25} turbidity={10} rayleigh={0.1} />
                        <Environment preset="night" />
                    </>
                ) : (
                    <>
                        <ambientLight intensity={0.6} color="#ffffff" />
                        <directionalLight
                            position={[50, 50, 25]}
                            intensity={1.5}
                            color="#fdf4ff"
                            castShadow
                            shadow-mapSize={[2048, 2048]}
                            shadow-camera-left={-30}
                            shadow-camera-right={30}
                            shadow-camera-top={30}
                            shadow-camera-bottom={-30}
                        />
                        <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
                        <Environment preset="city" />
                    </>
                )}

                <group position={[0, 0, 0]}>
                    {/* Towers */}
                    {blocks.map(([name, units], idx) => {
                        const pos = layout[name] || getDefaultPosition(name, idx);
                        return (
                            <DraggableObject
                                key={name}
                                name={name}
                                position={pos}
                                isActive={designMode && selectedObject === name}
                                onSelect={() => designMode && setSelectedObject(name)}
                                onMove={(newPos) => handleObjectMove(name, newPos)}
                            >
                                <Building
                                    blockName={name}
                                    units={units}
                                    position={[0, 0, 0]} // Group handles positioning
                                    onSelectUnit={onSelectUnit}
                                    alertUnits={alertUnits}
                                    designMode={designMode}
                                />
                            </DraggableObject>
                        );
                    })}

                    {/* Social Zone & Common Areas */}
                    <SocialZone />
                    {Object.keys(COMMON_AREAS_DEFAULTS).map((name) => (
                        <DraggableObject
                            key={name}
                            name={name}
                            position={layout[name] || getDefaultPosition(name, 0)}
                            isActive={designMode && selectedObject === name}
                            onSelect={() => designMode && setSelectedObject(name)}
                            onMove={(newPos) => handleObjectMove(name, newPos)}
                        >
                            <CommonArea
                                name={name}
                                position={[0, 0, 0]}
                                args={name === 'Salón Social' || name === 'Cancha' ? [4, 0.5, 3] : [3, 0.5, 2]}
                                color={name.includes('BBQ') ? '#fca5a5' : '#cbd5e1'}
                                designMode={designMode}
                            />
                        </DraggableObject>
                    ))}

                    {/* Consolidated Parking Lot */}
                    <DraggableObject
                        name="Parqueadero"
                        position={layout['Parqueadero'] || getDefaultPosition('Parqueadero', 0)}
                        isActive={designMode && selectedObject === 'Parqueadero'}
                        onSelect={() => designMode && setSelectedObject('Parqueadero')}
                        onMove={(newPos) => handleObjectMove('Parqueadero', newPos)}
                    >
                        <ParkingLot
                            slots={parkingSlots}
                            position={[0, 0, 0]}
                            selectedFloor={selectedFloor}
                            onSelectSlot={(slot) => {
                                if (designMode) return;
                                console.log('Selected slot:', slot);
                            }}
                        />
                    </DraggableObject>

                    {/* Decorative Trees */}
                    {decorativeTrees.map((tree) => (
                        <SimpleTree key={tree.id} position={tree.position} scale={tree.scale} />
                    ))}
                </group>

                <ContactShadows position={[0, -0.45, 0]} opacity={0.5} scale={150} blur={2.5} far={15} resolution={256} color="#1e293b" />

                {/* Suelo mejorado con color adaptativo */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                    <planeGeometry args={[300, 300]} />
                    <meshStandardMaterial color={isNightMode ? "#0f172a" : "#e2e8f0"} roughness={0.8} />
                </mesh>
            </Canvas>
        </div >
    );
};

export default BuildingExplorer3D;
