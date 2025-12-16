import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Fuel, Calculator, TrendingUp, History, Plus, Droplets, Gauge, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getVehicleSpecs } from '../services/aiService';

const FuelPage = () => {
    const { vehicles, maintenance, addFuelRecord } = useData();
    const [activeTab, setActiveTab] = useState('stats');
    const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');

    // --- CALCULATOR STATE ---
    const [calcData, setCalcData] = useState({
        capacity: 50, // Default tank capacity
        currentLevel: 25 // Current percentage
    });

    // Auto-fetch capacity when vehicle changes
    useEffect(() => {
        const fetchCapacity = async () => {
            const vehicle = vehicles.find(v => v.id === selectedVehicleId);
            if (!vehicle) return;

            // Optional: Check if we already have it stored locally to avoid API spam
            const storageKey = `tank_cap_${vehicle.id}`;
            const storedCap = localStorage.getItem(storageKey);

            if (storedCap) {
                setCalcData(prev => ({ ...prev, capacity: parseInt(storedCap) }));
                return;
            }

            // Fetch from AI
            const vehicleDesc = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`;
            const cap = await getVehicleSpecs(vehicleDesc);

            if (cap) {
                setCalcData(prev => ({ ...prev, capacity: cap }));
                localStorage.setItem(storageKey, cap.toString());
                toast.success(`Capacidad detectada: ${cap}L`, { icon: '⛽' });
            }
        };

        if (activeTab === 'calculator') {
            fetchCapacity();
        }
    }, [selectedVehicleId, activeTab, vehicles]);


    // --- ADD FUEL STATE ---
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        kilometraje: '',
        litros: '',
        costo_total: ''
    });

    // --- DERIVED DATA ---
    const vehicleFuelRecords = maintenance
        .filter(m => m.vehiculo_id === selectedVehicleId && m.tipo === 'Combustible')
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Stats Calculation
    const calculateStats = () => {
        if (vehicleFuelRecords.length < 2) return { kmPerLiter: 'N/A', lastMonthSpend: 0 };

        let totalKm = 0;
        let totalLiters = 0;

        // Simple efficiency calc (Last record Km - First record Km) / Total Liters excluding first? 
        // Better: Average of intervals.
        // Let's take just the latest efficiency if possible or simple aggregate.

        const sorted = [...vehicleFuelRecords].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Oldest first
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (last.kilometraje && first.kilometraje && last.kilometraje > first.kilometraje) {
            const kmDiff = last.kilometraje - first.kilometraje;
            // Sum liters of ALL records EXCEPT the first one (since first fill establishes the baseline)
            const literssum = sorted.slice(1).reduce((sum, r) => sum + parseLitros(r.notas), 0);
            if (literssum > 0) {
                return {
                    kmPerLiter: (kmDiff / literssum).toFixed(1),
                    lastMonthSpend: vehicleFuelRecords.reduce((sum, r) => sum + r.costo_mano_obra, 0)
                }
            }
        }

        return { kmPerLiter: '--', lastMonthSpend: vehicleFuelRecords.reduce((sum, r) => sum + r.costo_mano_obra, 0) };
    };

    const parseLitros = (notas) => {
        try {
            return JSON.parse(notas).litros || 0;
        } catch { return 0; }
    };

    const stats = calculateStats();

    // --- CALCULATOR LOGIC ---
    const litersNeeded = ((calcData.capacity * (100 - calcData.currentLevel)) / 100).toFixed(1);

    // --- HANDLERS ---
    const handleAddFuel = async (e) => {
        e.preventDefault();
        const data = {
            vehiculo_id: selectedVehicleId,
            ...formData,
            kilometraje: parseInt(formData.kilometraje),
            litros: parseFloat(formData.litros),
            costo_total: parseFloat(formData.costo_total)
        };

        const { error } = await addFuelRecord(data);
        if (error) toast.error('Error al guardar');
        else {
            toast.success('Carga registrada');
            setFormData({ ...formData, kilometraje: '', liters: '', costo_total: '' });
        }
    };

    if (vehicles.length === 0) return <div className="p-8 text-center">Registra un vehículo primero.</div>;

    return (
        <div className="pb-20">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Fuel className="w-8 h-8 text-indigo-600" />
                    Control de Combustible
                </h1>

                {/* Vehicle Selector */}
                <div className="mt-4">
                    <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    >
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['stats', 'calculator', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab
                            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500'
                            }`}
                    >
                        {tab === 'stats' && 'Resumen'}
                        {tab === 'calculator' && 'Calculadora'}
                        {tab === 'history' && 'Historial'}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {activeTab === 'stats' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
                            <Gauge className="w-6 h-6 mb-2 opacity-80" />
                            <p className="text-xs opacity-80 font-medium">Rendimiento</p>
                            <p className="text-2xl font-bold">{stats.kmPerLiter} <span className="text-sm font-normal">km/L</span></p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <DollarSignIcon className="w-6 h-6 mb-2 text-green-500" />
                            <p className="text-xs text-slate-500 font-medium">Gasto Total</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">${stats.lastMonthSpend}</p>
                        </div>
                    </div>

                    {/* Quick Add Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded p-0.5" />
                            Registrar Carga
                        </h3>
                        <form onSubmit={handleAddFuel} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Km Actual</label>
                                    <input required type="number" className="w-full mt-1 p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                                        value={formData.kilometraje} onChange={e => setFormData({ ...formData, kilometraje: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Litros</label>
                                    <input required type="number" step="0.1" className="w-full mt-1 p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                                        value={formData.litros} onChange={e => setFormData({ ...formData, litros: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Costo Total ($)</label>
                                <input required type="number" className="w-full mt-1 p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-lg font-bold"
                                    value={formData.costo_total} onChange={e => setFormData({ ...formData, costo_total: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
                                Guardar Carga
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'calculator' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-2">
                    <h3 className="font-bold mb-6 text-center text-lg">⛽ Calculadora de Llenado</h3>

                    <div className="flex justify-center mb-8">
                        <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-4xl font-black text-indigo-600">{litersNeeded}</span>
                                <p className="text-xs text-slate-400 font-bold uppercase">Litros Faltantes</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span>Capacidad Tanque</span>
                                <span>{calcData.capacity} L</span>
                            </div>
                            <input
                                type="range" min="30" max="120" step="5"
                                value={calcData.capacity}
                                onChange={(e) => setCalcData({ ...calcData, capacity: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span>Nivel Actual (Medidor)</span>
                                <span>{calcData.currentLevel}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="5"
                                value={calcData.currentLevel}
                                onChange={(e) => setCalcData({ ...calcData, currentLevel: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                                <span>E</span>
                                <span>1/4</span>
                                <span>1/2</span>
                                <span>3/4</span>
                                <span>F</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-3 animate-in slide-in-from-right-2">
                    {vehicleFuelRecords.map(record => (
                        <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                                    <Droplets className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">${record.costo_mano_obra}</p>
                                    <p className="text-xs text-slate-500">{new Date(record.fecha).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-600 dark:text-slate-300">{parseLitros(record.notas)} L</p>
                                <p className="text-xs text-slate-400">{record.kilometraje} km</p>
                            </div>
                        </div>
                    ))}
                    {vehicleFuelRecords.length === 0 && <p className="text-center text-slate-400 py-8">No hay registros aún.</p>}
                </div>
            )}
        </div>
    );
};

const DollarSignIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
)

export default FuelPage;
