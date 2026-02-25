import React, { useState, useEffect } from 'react';
import { formatVenezuelanPhone } from '../../utils/formatPhone';
import {
  User, Wrench, Phone, MapPin, ClipboardList,
  Save, X, Star, Briefcase, Zap
} from 'lucide-react';

const MechanicForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    telefono: '',
    direccion: '',
    notas: '',
  });

  const categories = [
    'Mecánica General', 'Electricidad', 'Frenos',
    'Transmisión', 'Aires Acondicionados', 'Suspensión',
    'Inyección Electrónica', 'Latonería y Pintura'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      setFormData(prev => ({ ...prev, [name]: formatVenezuelanPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectCategory = (cat) => {
    setFormData(prev => ({ ...prev, especialidad: cat }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Intro */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/50 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Perfil del Especialista</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Registra los datos de contacto y especialidad de tu mecánico de confianza.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <User className="w-4 h-4 text-blue-500" /> Nombre del Mecánico
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
            placeholder="Ej: Pedro Pérez"
          />
        </div>

        {/* Especialidad & Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Wrench className="w-4 h-4 text-orange-500" /> Especialidad Principal
            </label>
            <input
              type="text"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
              placeholder="Ej: Motores Diesel"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Phone className="w-4 h-4 text-emerald-500" /> Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
              placeholder="+58-000-0000000"
            />
          </div>
        </div>

        {/* Categorías Rápidas */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${formData.especialidad === cat
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dirección */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <MapPin className="w-4 h-4 text-red-500" /> Dirección del Taller
          </label>
          <div className="relative">
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium pl-12"
              placeholder="Ej: Calle 5, Taller Don Juan..."
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <ClipboardList className="w-4 h-4 text-purple-500" /> Notas Adicionales
          </label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            rows="3"
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 dark:text-white font-medium leading-relaxed"
            placeholder="Horarios, referencias, marcas que atiende..."
          ></textarea>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95"
        >
          Descartar
        </button>
        <button
          type="submit"
          className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95"
        >
          {initialData ? <><Zap className="w-4 h-4" /> Actualizar Perfil</> : <><Save className="w-4 h-4" /> Guardar Especialista</>}
        </button>
      </div>
    </form>
  );
};

export default MechanicForm;
