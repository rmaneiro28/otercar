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

            {/* Documents View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <VehicleDocuments />
            </div>
        </div>
    );
};

export default Documents;
