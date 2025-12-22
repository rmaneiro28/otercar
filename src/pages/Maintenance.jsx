import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, Wrench, Calendar, Car, DollarSign, Search, FileText, Edit2 } from 'lucide-react';
import Modal from '../components/UI/Modal';
import MaintenanceForm from '../components/Forms/MaintenanceForm';
import AIRecommendations from '../components/AI/AIRecommendations';
import { toast } from 'sonner';

const Maintenance = () => {
    const { maintenance, vehicles, mechanics, addMaintenance, updateMaintenance } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaintenance, setEditingMaintenance] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.openAddModal) {
            setIsModalOpen(true);
            // Clear state to prevent reopening on refresh (optional but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleAdd = () => {
        setEditingMaintenance(null);
        setIsModalOpen(true);
    };

    const handleEdit = (maint) => {
        setEditingMaintenance(maint);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data, parts) => {
        let result;
        if (editingMaintenance) {
            result = await updateMaintenance(editingMaintenance.id, data, parts);
        } else {
            result = await addMaintenance(data, parts);
        }

        if (result && result.error) {
            toast.error(editingMaintenance ? 'Error al actualizar mantenimiento' : 'Error al registrar mantenimiento');
        } else {
            toast.success(editingMaintenance ? 'Mantenimiento actualizado exitosamente' : 'Mantenimiento registrado exitosamente');
            setIsModalOpen(false);
            setEditingMaintenance(null);
        }
    };

    // Helper to get vehicle name
    const getVehicleName = (id) => {
        const v = vehicles.find(v => v.id === id);
        return v ? `${v.marca} ${v.modelo}` : 'Vehículo desconocido';
    };

    // Helper to get mechanic name
    const getMechanicName = (id) => {
        const m = mechanics.find(m => m.id === id);
        return m ? m.nombre : 'Mecánico no asignado';
    };

    const filteredMaintenance = maintenance.filter(item => {
        const matchesSearch = item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getVehicleName(item.vehiculo_id).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVehicle = selectedVehicleId ? item.vehiculo_id === selectedVehicleId : true;
        return matchesSearch && matchesVehicle;
    });

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mantenimiento y Reparaciones</h1>
                    <p className="text-slate-500 dark:text-slate-400">Registro histórico de trabajos realizados.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Registrar Mantenimiento</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-800 dark:text-white"
                    >
                        <option value="">Todos los Vehículos</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedVehicle && (
                <div className="mb-8">
                    <AIRecommendations vehicle={selectedVehicle} />
                </div>
            )}

            <div className="space-y-4">
                {filteredMaintenance.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wrench className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Sin registros</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">No hay mantenimientos registrados aún.</p>
                        <button
                            onClick={handleAdd}
                            className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 hover:underline"
                        >
                            Registrar el primero
                        </button>
                    </div>
                ) : (
                    filteredMaintenance.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{item.tipo}</h3>
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium">
                                                {new Date(item.fecha + 'T12:00:00').toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 mb-2">{item.descripcion}</p>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Car className="w-4 h-4" />
                                                {getVehicleName(item.vehiculo_id)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Wrench className="w-4 h-4" />
                                                {getMechanicName(item.mecanico_id)}
                                            </div>
                                            {item.kilometraje && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">KM:</span> {item.kilometraje}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center min-w-[120px] gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            title="Editar mantenimiento"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            <span className="sr-only">Editar</span>
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">COSTO TOTAL</p>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                            ${item.costo_total ? item.costo_total.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingMaintenance(null);
                }}
                title={editingMaintenance ? "Editar Mantenimiento" : "Registrar Mantenimiento"}
            >
                <MaintenanceForm
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingMaintenance(null);
                    }}
                    initialData={editingMaintenance}
                />
            </Modal>
        </div>
    );
};

export default Maintenance;
