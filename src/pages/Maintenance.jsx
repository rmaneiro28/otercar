import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, Wrench, Calendar, Car, DollarSign, Search, User, Edit2 } from 'lucide-react';
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

    const getVehicleName = (id) => {
        const v = vehicles.find(v => v.id === id);
        return v ? `${v.marca} ${v.modelo}` : 'Vehículo desconocido';
    };

    const getMechanicName = (id) => {
        const m = mechanics.find(m => m.id === id);
        return m ? m.nombre : 'Mecánico no asignado';
    };

    const filteredMaintenance = maintenance.filter(item => {
        const matchesSearch = (item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            getVehicleName(item.vehiculo_id).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVehicle = selectedVehicleId ? item.vehiculo_id === selectedVehicleId : true;
        return matchesSearch && matchesVehicle;
    });

    const totalSpent = maintenance.reduce((sum, item) => sum + (item.costo_total || 0), 0);
    const thisMonthSpent = maintenance
        .filter(item => {
            const date = new Date(item.fecha);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, item) => sum + (item.costo_total || 0), 0);
    const totalServices = maintenance.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Style Original */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mantenimiento y Reparaciones</h1>
                    <p className="text-slate-500 dark:text-slate-400">Histórico de servicios y salud de tu flota.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Registrar Mantenimiento</span>
                </button>
            </div>

            {/* Simple Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión Total</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">${totalSpent.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Este Mes</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">${thisMonthSpent.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicios</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{totalServices}</p>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción o vehículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-800 dark:text-white font-bold"
                    >
                        <option value="">Todos los Vehículos</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedVehicleId && (
                <div className="animate-in slide-in-from-top duration-500">
                    <AIRecommendations vehicle={vehicles.find(v => v.id === selectedVehicleId)} />
                </div>
            )}

            {/* List Section - Clean Card Design */}
            <div className="space-y-4">
                {filteredMaintenance.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Sin registros</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">No hay mantenimientos registrados aún.</p>
                        <button onClick={handleAdd} className="text-blue-600 font-bold hover:underline">Registrar el primero</button>
                    </div>
                ) : (
                    filteredMaintenance.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-md transition-all group">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${item.tipo?.includes('Preventivo') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        }`}>
                                        <Wrench className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.tipo?.includes('Preventivo') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.tipo}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.fecha + 'T12:00:00').toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {getVehicleName(item.vehiculo_id)}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm italic font-medium">"{item.descripcion}"</p>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col justify-between md:items-end gap-3 min-w-[150px]">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                                            ${item.costo_total ? item.costo_total.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {item.mantenimiento_repuestos && item.mantenimiento_repuestos.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                    <div className="flex flex-wrap gap-2">
                                        {item.mantenimiento_repuestos.map((part, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                                <span className="text-blue-600 mr-1">{part.cantidad}x</span> {part.inventario?.nombre || 'Repuesto'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {getMechanicName(item.mecanico_id)}</span>
                                {item.kilometraje && <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> {item.kilometraje.toLocaleString()} KM</span>}
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
                title={editingMaintenance ? "Editar Diagnóstico" : "Nuevo Reporte de Servicio"}
                size="max-w-4xl"
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
