import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const VehicleForm = ({ onSubmit, initialData, onCancel }) => {
    const { owners } = useData();
    const [formData, setFormData] = useState({
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        placa: '',
        color: '',
        vin: '',
        kilometraje: 0,
        propietario_id: '', // Client ID
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
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente / Propietario</label>
                <select
                    name="propietario_id"
                    value={formData.propietario_id || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                    <option value="">-- Seleccionar Cliente --</option>
                    {owners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                            {owner.nombre_completo} {owner.email ? `(${owner.email})` : ''}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Selecciona el cliente dueño del vehículo.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                    <input
                        type="text"
                        name="marca"
                        value={formData.marca}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Toyota"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                    <input
                        type="text"
                        name="modelo"
                        value={formData.modelo}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Corolla"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                    <input
                        type="number"
                        name="anio"
                        value={formData.anio}
                        onChange={handleChange}
                        required
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kilometraje (km)</label>
                    <input
                        type="number"
                        name="kilometraje"
                        value={formData.kilometraje}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                    <input
                        type="text"
                        name="placa"
                        value={formData.placa}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="ABC-123"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                    <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Blanco"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">VIN (Opcional)</label>
                <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="1HGCM..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    {initialData ? 'Actualizar' : 'Guardar Vehículo'}
                </button>
            </div>
        </form>
    );
};

export default VehicleForm;
