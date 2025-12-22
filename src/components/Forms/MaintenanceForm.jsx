import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Save, X, Car, Wrench, DollarSign, Calendar, Mic, Loader2 } from 'lucide-react';
import { parseMaintenanceVoice } from '../../services/aiService';
import { toast } from 'sonner';

// Datepicker imports
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';

registerLocale('es', es);

const MaintenanceForm = ({ onSubmit, onCancel }) => {
    const { vehicles, mechanics, inventory } = useData();
    const [isListening, setIsListening] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

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

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            toast.error('Tu navegador no soporta entrada de voz.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info('Escuchando... Di los detalles del mantenimiento.');
        };

        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setIsProcessingVoice(true);
            toast.loading('Procesando voz con IA...');

            try {
                const aiData = await parseMaintenanceVoice(transcript);
                if (aiData) {
                    setFormData(prev => ({
                        ...prev,
                        tipo: aiData.tipo || prev.tipo,
                        descripcion: aiData.descripcion || transcript,
                        kilometraje: aiData.kilometraje || prev.kilometraje,
                        costo_mano_obra: aiData.costo_estimado || prev.costo_mano_obra
                    }));
                    toast.dismiss();
                    toast.success('¡Datos completados por voz!');
                } else {
                    toast.dismiss();
                    toast.error('No se pudo interpretar el audio.');
                }
            } catch (error) {
                console.error(error);
                // Show the specific error message from aiService if available
                toast.error(error.message === 'Error IA' ? 'Error al procesar voz.' : error.message);
            } finally {
                setIsProcessingVoice(false);
            }
        };

        recognition.start();
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
            {/* Voice Assistant Button - High Visibility */}
            <div className="flex justify-end bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-purple-900 text-sm">Asistente de Voz IA</h3>
                    <p className="text-xs text-purple-700 hidden sm:block">Dicta el diagnóstico y la IA llenará el formulario.</p>
                </div>
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={isListening || isProcessingVoice}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                >
                    {isProcessingVoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className={`w-5 h-5 ${isListening ? 'animate-ping' : ''}`} />}
                    {isListening ? 'Escuchando...' : isProcessingVoice ? 'Procesando...' : 'Dictar Diagnóstico'}
                </button>
            </div>

            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehículo</label>
                    <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            name="vehiculo_id"
                            value={formData.vehiculo_id}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                        >
                            <option value="">Seleccionar Vehículo</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mecánico (Opcional)</label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            name="mecanico_id"
                            value={formData.mecanico_id}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                        >
                            <option value="">Seleccionar Mecánico</option>
                            {mechanics.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre} - {m.especialidad}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Servicio</label>
                    <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                    >
                        <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                        <option value="Reparación Correctiva">Reparación Correctiva</option>
                        <option value="Inspección">Inspección</option>
                        <option value="Emergencia">Emergencia</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                    <div className="space-y-2">
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors z-10" />
                            <DatePicker
                                selected={formData.fecha ? new Date(formData.fecha + 'T12:00:00') : null}
                                onChange={(date) => {
                                    if (date) {
                                        setFormData(prev => ({ ...prev, fecha: date.toISOString().split('T')[0] }));
                                    }
                                }}
                                dateFormat="dd/MM/yyyy"
                                locale="es"
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                                scrollableYearDropdown
                                yearDropdownItemNumber={15}
                                minDate={formData.vehiculo_id ? new Date(`${vehicles.find(v => v.id === formData.vehiculo_id)?.anio}-01-01T12:00:00`) : null}
                                maxDate={new Date()}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                                placeholderText="Seleccionar fecha"
                                wrapperClassName="w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, fecha: new Date().toISOString().split('T')[0] }))}
                                className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    setFormData(prev => ({ ...prev, fecha: yesterday.toISOString().split('T')[0] }));
                                }}
                                className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                            >
                                Ayer
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kilometraje Actual</label>
                    <input
                        type="number"
                        name="kilometraje"
                        value={formData.kilometraje}
                        onChange={handleChange}
                        placeholder="Ej: 50000"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Costo Mano de Obra ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="number"
                            name="costo_mano_obra"
                            value={formData.costo_mano_obra}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción del Trabajo</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="2"
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 dark:text-white"
                    placeholder="Detalles de lo realizado..."
                ></textarea>
            </div>

            {/* Parts Selection Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Repuestos Utilizados (Opcional)
                </h3>

                <div className="flex gap-2 mb-4">
                    <select
                        value={currentPartId}
                        onChange={(e) => setCurrentPartId(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 dark:text-white"
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
                        className="w-20 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 dark:text-white"
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
                            <div key={part.id} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">{part.nombre}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {part.cantidad_usada} x ${part.precio}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">
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
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Subtotal Repuestos:</p>
                            <p className="font-bold text-slate-800 dark:text-white">${partsTotal.toFixed(2)}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-2">No se han agregado repuestos</p>
                )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-lg font-bold text-blue-800 dark:text-blue-300">Costo Total Estimado</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium flex items-center gap-2"
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
