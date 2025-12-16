import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FileText, ChevronDown, ChevronRight, AlertTriangle, Filter } from 'lucide-react';
import VehicleDocuments from '../components/Documents/VehicleDocuments';

const Documents = () => {
    const { vehicles, company } = useData();
    const [expandedVehicle, setExpandedVehicle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleVehicle = (id) => {
        if (expandedVehicle === id) setExpandedVehicle(null);
        else setExpandedVehicle(id);
    };

    const filteredVehicles = vehicles.filter(v =>
        v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.placa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-8 h-8 text-indigo-600" />
                    Gestión de Documentos
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Administra seguros, licencias y trámites de tu flota.</p>
            </div>

            {/* Plan Alert if Taller (Should not happen if sidebar hidden, but safety net) */}
            {company?.plan === 'taller' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">Aviso:</span>
                    </div>
                    <p className="text-sm mt-1">
                        Esta sección está optimizada para planes Personales. Como Taller, gestionas documentos directamente con tus clientes.
                    </p>
                </div>
            )}

            {/* Vehicle List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Vehículos Registrados ({filteredVehicles.length})</h3>
                    <div className="relative">
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar placa..."
                            className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVehicles.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No se encontraron vehículos.
                        </div>
                    ) : (
                        filteredVehicles.map(vehicle => (
                            <div key={vehicle.id} className="group">
                                <button
                                    onClick={() => toggleVehicle(vehicle.id)}
                                    className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${expandedVehicle === vehicle.id ? 'bg-indigo-50/30 dark:bg-slate-800/30' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                            {vehicle.marca.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800 dark:text-white">
                                                {vehicle.marca} {vehicle.modelo}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit mt-1">
                                                {vehicle.placa}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-400">
                                        {expandedVehicle === vehicle.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                </button>

                                {expandedVehicle === vehicle.id && (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                        <div className="max-w-3xl">
                                            <VehicleDocuments vehicleId={vehicle.id} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Documents;
