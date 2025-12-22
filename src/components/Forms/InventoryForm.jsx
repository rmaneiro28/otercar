import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const InventoryForm = ({ onSubmit, initialData, onCancel }) => {
  const { vehicles, stores } = useData();
  const [formData, setFormData] = useState({
    nombre: '',
    numero_parte: '',
    categoria: '',
    cantidad: 0,
    precio: 0,
    notas: '',
    vehiculo_id: '',
    tienda_id: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert empty string to null for optional foreign key and sanitize numeric values
    const submissionData = {
      ...formData,
      vehiculo_id: formData.vehiculo_id === '' ? null : formData.vehiculo_id,
      tienda_id: formData.tienda_id === '' ? null : formData.tienda_id,
      cantidad: formData.cantidad === '' ? 0 : Number(formData.cantidad),
      precio: formData.precio === '' ? 0 : Number(formData.precio)
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Repuesto</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Filtro de Aceite"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Parte</label>
          <input
            type="text"
            name="numero_parte"
            value={formData.numero_parte}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="PH-1234"
          />
        </div>
      </div>



      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
          >
            <option value="">Seleccionar Categoría</option>
            <option value="Motor">Motor</option>
            <option value="Transmisión">Transmisión</option>
            <option value="Frenos">Frenos</option>
            <option value="Suspensión y Dirección">Suspensión y Dirección</option>
            <option value="Sistema Eléctrico">Sistema Eléctrico</option>
            <option value="Carrocería">Carrocería</option>
            <option value="Interior">Interior</option>
            <option value="Climatización">Climatización (A/C)</option>
            <option value="Fluidos y Químicos">Fluidos y Químicos</option>
            <option value="Neumáticos y Ruedas">Neumáticos y Ruedas</option>
            <option value="Escape y Emisiones">Escape y Emisiones</option>
            <option value="Filtros">Filtros</option>
            <option value="Iluminación">Iluminación</option>
            <option value="Accesorios">Accesorios</option>
            <option value="Herramientas">Herramientas</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehículo Asociado</label>
          <select
            name="vehiculo_id"
            value={formData.vehiculo_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
          >
            <option value="">Ninguno / General</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.marca} {v.modelo} ({v.placa})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tienda / Proveedor</label>
        <select
          name="tienda_id"
          value={formData.tienda_id || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
        >
          <option value="">Desconocido / No registrado</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Unitario ($)</label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
        <textarea
          name="notas"
          value={formData.notas}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Detalles adicionales..."
        ></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
        >
          {initialData ? 'Actualizar' : 'Guardar Repuesto'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
