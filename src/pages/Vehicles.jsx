import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Car, Edit2, Trash2, Search } from 'lucide-react';
import Modal from '../components/UI/Modal';
import VehicleForm from '../components/Forms/VehicleForm';
import { toast } from 'sonner';

const Vehicles = () => {
  const { vehicles, owners, addVehicle, updateVehicle, deleteVehicle } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
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
        toast.error('Error al agregar vehículo');
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
          <h1 className="text-2xl font-bold text-slate-800">Vehículos</h1>
          <p className="text-slate-500">Gestiona tu flota de vehículos personal.</p>
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
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No hay vehículos registrados</h3>
          <p className="text-slate-500 mb-6">Comienza agregando tu primer vehículo.</p>
          <button
            onClick={handleAdd}
            className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
          >
            Agregar Vehículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg">
                    {vehicle.marca.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{vehicle.marca} {vehicle.modelo}</h3>
                    <p className="text-slate-500 text-sm">{vehicle.anio} • {vehicle.color}</p>
                    {/* Display Owner/Client */}
                    {owners.find(o => o.id === vehicle.propietario_id) && (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Cliente: {owners.find(o => o.id === vehicle.propietario_id).nombre_completo}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg w-fit">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">PLACA</span>
                <span className="font-mono font-medium">{vehicle.placa}</span>
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default Vehicles;
