import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Car, Edit2, Trash2, Search, Eye } from 'lucide-react';
import Modal from '../components/UI/Modal';
import UpgradeModal from '../components/UI/UpgradeModal';
import VehicleDetailModal from '../components/UI/VehicleDetailModal';
import VehicleForm from '../components/Forms/VehicleForm';
import { toast } from 'sonner';

const Vehicles = () => {
  const { vehicles, owners, addVehicle, updateVehicle, deleteVehicle, company, recommendations, maintenance } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Vehicle Health Score
  // Calculate Vehicle Health Score
  const calculateHealthDetails = (vehicleId) => {
    let score = 100;
    const details = [];
    const improvements = [];

    const vehicleRecs = recommendations.filter(r => r.vehiculo_id === vehicleId);
    const vehicleMaint = maintenance.filter(m => m.vehiculo_id === vehicleId);

    // Deduct for alerts (high severity)
    const alerts = vehicleRecs.filter(r => r.tipo === 'alerta').length;
    if (alerts > 0) {
      const penalty = alerts * 20;
      score -= penalty;
      details.push({ label: `${alerts} Alerta(s) crítica(s)`, points: -penalty, color: 'text-red-500' });
      improvements.push('Atiende las alertas urgentes reportadas por la IA.');
    }

    // Deduct for maintenance suggestions (medium severity)
    const suggestions = vehicleRecs.filter(r => r.tipo === 'mantenimiento').length;
    if (suggestions > 0) {
      const penalty = suggestions * 10;
      score -= penalty;
      details.push({ label: `${suggestions} Recomendación(es)`, points: -penalty, color: 'text-yellow-500' });
      improvements.push('Revisa las sugerencias de mantenimiento pendientes.');
    }

    // Bonus/Penalty for maintenance history
    if (vehicleMaint.length > 0) {
      // Check last maintenance date
      const lastMaint = new Date(Math.max(...vehicleMaint.map(m => new Date(m.fecha))));
      const diffDays = Math.ceil((new Date() - lastMaint) / (1000 * 60 * 60 * 24));

      if (diffDays < 90) {
        score += 5;
        details.push({ label: 'Mantenimiento reciente (<90 días)', points: +5, color: 'text-green-500' });
      }
      else if (diffDays > 180) {
        score -= 10;
        details.push({ label: 'Mantenimiento vencido (>6 meses)', points: -10, color: 'text-red-500' });
        improvements.push('Programa un servicio de mantenimiento preventivo lo antes posible.');
      }
    } else {
      score -= 5;
      details.push({ label: 'Sin historial de mantenimiento', points: -5, color: 'text-red-500' });
      improvements.push('Registra los mantenimientos de tu vehículo para llevar un mejor control.');
    }

    score = Math.max(0, Math.min(100, score));

    if (score === 100 && improvements.length === 0) {
      improvements.push('¡Tu vehículo está en excelentes condiciones! Sigue así.');
    }

    return { score, details, improvements };
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    if (score >= 70) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-500 bg-red-50 dark:bg-red-900/20';
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicleDetail(vehicle);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      const result = await deleteVehicle(id);
      if (result && result.error) {
        toast.error('Error al eliminar vehículo');
      } else {
        toast.success('Vehículo eliminado correctamente');
      }
    }
  };

  const handleSubmit = async (data) => {
    let result;
    if (editingVehicle) {
      result = await updateVehicle(editingVehicle.id, data);
      if (result && result.error) {
        toast.error('Error al actualizar vehículo');
      } else {
        toast.success('Vehículo actualizado correctamente');
        setIsModalOpen(false);
      }
    } else {
      result = await addVehicle(data);
      if (result && result.error) {
        // Check for specific limit error message from DataContext
        if (result.error.message && result.error.message.includes('limitado')) {
          setIsModalOpen(false); // Close form modal
          setIsUpgradeModalOpen(true); // Open upgrade modal
          // toast.error(result.error.message); // Optional: still show toast? Maybe not needed if modal opens.
        } else {
          toast.error(result.error.message || 'Error al agregar vehículo');
        }
      } else {
        toast.success('Vehículo agregado correctamente');
        setIsModalOpen(false);
      }
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Vehículos</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona tu flota de vehículos personal.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Vehículo</span>
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo o placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No hay vehículos registrados</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Comienza agregando tu primer vehículo.</p>
          <button
            onClick={handleAdd}
            className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 hover:underline"
          >
            Agregar Vehículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const { score: healthScore, details, improvements } = calculateHealthDetails(vehicle.id);
            const healthColorClass = getHealthColor(healthScore);

            return (
              <div
                key={vehicle.id}
                onClick={() => handleViewDetails(vehicle)}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {vehicle.marca.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{vehicle.marca} {vehicle.modelo}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{vehicle.anio} • {vehicle.color}</p>
                      {/* Display Owner/Client */}
                      {owners.find(o => o.id === vehicle.propietario_id) && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                          Cliente: {owners.find(o => o.id === vehicle.propietario_id).nombre_completo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg w-fit">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">PLACA</span>
                    <span className="font-mono font-medium">{vehicle.placa}</span>
                  </div>

                  {/* Health Indicator with Tooltip */}
                  <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${healthColorClass} group/tooltip`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                    <span className="text-sm font-bold">{healthScore}%</span>
                    <span className="text-xs font-medium opacity-80">Salud</span>

                    {/* Tooltip Popup */}
                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-2">Desglose de Salud</h4>

                      <div className="space-y-2 mb-3">
                        {details.length > 0 ? (
                          details.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                              <span className={`font-bold ${item.color}`}>
                                {item.points > 0 ? '+' : ''}{item.points}%
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">Estado base (100%)</p>
                        )}
                      </div>

                      {improvements.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Recomendaciones</span>
                          <ul className="list-disc list-inside space-y-1">
                            {improvements.map((imp, idx) => (
                              <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      >
        <VehicleForm
          onSubmit={handleSubmit}
          initialData={editingVehicle}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlan={company?.plan || 'free'}
      />

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        isOpen={!!selectedVehicleDetail}
        onClose={() => setSelectedVehicleDetail(null)}
        vehicle={selectedVehicleDetail}
        healthScore={selectedVehicleDetail ? calculateHealthDetails(selectedVehicleDetail.id).score : 0}
      />
    </div>
  );
};

export default Vehicles;
