import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Save, X, Car, Wrench, DollarSign, Calendar } from 'lucide-react';

const MaintenanceForm = ({ onSubmit, onCancel }) => {
    const { vehicles, mechanics, inventory } = useData();

    // Main form state
    const [formData, setFormData] = useState({
        vehiculo_id: '',
        mecanico_id: '',
        tipo: 'Mantenimiento Preventivo',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        kilometraje: '',
        costo_mano_obra: 0,
        notas: ''
    });

    // Parts selection state
    const [selectedParts, setSelectedParts] = useState([]);
    const [currentPartId, setCurrentPartId] = useState('');
    const [currentPartQty, setCurrentPartQty] = useState(1);

    // Derived totals
    const partsTotal = selectedParts.reduce((sum, part) => sum + (part.precio * part.cantidad_usada), 0);
    const grandTotal = parseFloat(formData.costo_mano_obra || 0) + partsTotal;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPart = () => {
        if (!currentPartId) return;

        const part = inventory.find(p => p.id === currentPartId);
        if (!part) return;

        if (currentPartQty > part.cantidad) {
            alert(`Solo hay ${part.cantidad} unidades disponibles de ${part.nombre}`);
            return;
        }

        const existing = selectedParts.find(p => p.id === currentPartId);
        if (existing) {
            setSelectedParts(selectedParts.map(p =>
                p.id === currentPartId
                    ? { ...p, cantidad_usada: p.cantidad_usada + parseInt(currentPartQty) }
                    : p
            ));
        } else {
            setSelectedParts([...selectedParts, { ...part, cantidad_usada: parseInt(currentPartQty) }]);
        }

        setCurrentPartId('');
        setCurrentPartQty(1);
    };

    const removePart = (id) => {
        setSelectedParts(selectedParts.filter(p => p.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const maintenanceData = {
            ...formData,
            costo_total: grandTotal
        };

        onSubmit(maintenanceData, selectedParts);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehículo</label>
                    <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            name="vehiculo_id"
                            value={formData.vehiculo_id}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">Seleccionar Vehículo</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mecánico</label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            name="mecanico_id"
                            value={formData.mecanico_id}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">Seleccionar Mecánico</option>
                            {mechanics.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre} - {m.especialidad}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Servicio</label>
                    <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                        <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                        <option value="Reparación Correctiva">Reparación Correctiva</option>
                        <option value="Inspección">Inspección</option>
                        <option value="Emergencia">Emergencia</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kilometraje Actual</label>
                    <input
                        type="number"
                        name="kilometraje"
                        value={formData.kilometraje}
                        onChange={handleChange}
                        placeholder="Ej: 50000"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo Mano de Obra ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="number"
                            name="costo_mano_obra"
                            value={formData.costo_mano_obra}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Trabajo</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="2"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Detalles de lo realizado..."
                ></textarea>
            </div>

            {/* Parts Selection Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Repuestos Utilizados
                </h3>

                <div className="flex gap-2 mb-4">
                    <select
                        value={currentPartId}
                        onChange={(e) => setCurrentPartId(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        <option value="">Seleccionar Repuesto</option>
                        {inventory.map(p => (
                            <option key={p.id} value={p.id} disabled={p.cantidad <= 0}>
                                {p.nombre} - Stock: {p.cantidad} - ${p.precio}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={currentPartQty}
                        onChange={(e) => setCurrentPartQty(e.target.value)}
                        min="1"
                        className="w-20 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleAddPart}
                        disabled={!currentPartId}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {selectedParts.length > 0 ? (
                    <div className="space-y-2">
                        {selectedParts.map(part => (
                            <div key={part.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <div>
                                    <p className="font-medium text-slate-800">{part.nombre}</p>
                                    <p className="text-xs text-slate-500">
                                        {part.cantidad_usada} x ${part.precio}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-bold text-slate-700">
                                        ${(part.cantidad_usada * part.precio).toFixed(2)}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => removePart(part.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                            <p className="text-sm font-medium text-slate-600">Subtotal Repuestos:</p>
                            <p className="font-bold text-slate-800">${partsTotal.toFixed(2)}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-2">No se han agregado repuestos</p>
                )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-lg font-bold text-blue-800">Costo Total Estimado</p>
                <p className="text-2xl font-bold text-blue-600">${grandTotal.toFixed(2)}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Registrar Mantenimiento
                </button>
            </div>
        </form>
    );
};

export default MaintenanceForm;
