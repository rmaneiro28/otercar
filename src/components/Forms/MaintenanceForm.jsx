import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
    Plus, Trash2, Save, X, Car, Wrench, DollarSign, Calendar,
    Mic, Loader2, ClipboardList, ChevronRight, ChevronLeft,
    CheckCircle2, AlertCircle, Sparkles, Package, User
} from 'lucide-react';
import { parseMaintenanceVoice } from '../../services/aiService';
import { toast } from 'sonner';

// Components
import Modal from '../UI/Modal';
import InventoryForm from './InventoryForm';
import MechanicForm from './MechanicForm';

// Datepicker imports
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';

registerLocale('es', es);

const MaintenanceForm = ({ onSubmit, onCancel, initialData }) => {
    const { vehicles, mechanics, inventory, addPart, addMechanic } = useData();
    const [currentStep, setCurrentStep] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

    // Quick Add Modals
    const [isQuickAddPartOpen, setIsQuickAddPartOpen] = useState(false);
    const [isQuickAddMechanicOpen, setIsQuickAddMechanicOpen] = useState(false);

    // Main form state
    const [formData, setFormData] = useState({
        vehiculo_id: initialData?.vehiculo_id || '',
        mecanico_id: initialData?.mecanico_id || '',
        tipo: initialData?.tipo || 'Mantenimiento Preventivo',
        descripcion: initialData?.descripcion || '',
        fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
        kilometraje: initialData?.kilometraje || '',
        costo_mano_obra: initialData?.costo_mano_obra || 0,
        notas: initialData?.notas || ''
    });

    // Parts selection state
    const [selectedParts, setSelectedParts] = useState(() => {
        if (initialData?.mantenimiento_repuestos) {
            return initialData.mantenimiento_repuestos.map(p => ({
                id: p.repuesto_id,
                nombre: p.inventario?.nombre || 'Repuesto',
                precio: p.precio_unitario,
                cantidad_usada: p.cantidad
            }));
        }
        return [];
    });
    const [currentPartId, setCurrentPartId] = useState('');
    const [currentPartQty, setCurrentPartQty] = useState(1);

    // Totals
    const partsTotal = selectedParts.reduce((sum, part) => sum + (part.precio * part.cantidad_usada), 0);
    const grandTotal = parseFloat(formData.costo_mano_obra || 0) + partsTotal;

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPart = () => {
        if (!currentPartId) return;
        const part = inventory?.find(p => p.id === currentPartId);
        if (!part) return;

        if (currentPartQty > part.cantidad) {
            toast.error(`Stock insuficiente. Solo hay ${part.cantidad} disponibles.`);
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
        toast.success(`${part.nombre} agregado`);
    };

    const removePart = (id) => {
        setSelectedParts(selectedParts.filter(p => p.id !== id));
    };

    const handleQuickAddPart = async (partData) => {
        const result = await addPart(partData);
        if (result && !result.error) {
            toast.success('Repuesto registrado y agregado');
            setIsQuickAddPartOpen(false);
            const newPart = result.data;
            // Automatically add the new part to selected parts
            setSelectedParts(prev => {
                const existing = prev.find(p => p.id === newPart.id);
                if (existing) return prev;
                return [...prev, { ...newPart, cantidad_usada: 1 }];
            });
        } else {
            toast.error(result?.error?.message || 'Error al registrar repuesto');
        }
    };

    const handleQuickAddMechanic = async (mechData) => {
        const result = await addMechanic(mechData);
        if (result && !result.error) {
            toast.success('Mecánico registrado y seleccionado');
            setIsQuickAddMechanicOpen(false);
            setFormData(prev => ({ ...prev, mecanico_id: result.data.id }));
        } else {
            toast.error(result?.error?.message || 'Error al registrar mecánico');
        }
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
            toast.info('Escuchando... Cuéntame qué le hiciste al vehículo.');
        };

        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setIsProcessingVoice(true);
            const tId = toast.loading('La IA está analizando tu diagnóstico...');

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
                    toast.success('¡Increíble! He completado los datos por ti.', { id: tId });
                    // Si estamos en el paso 2, avanzar automáticamente si se completó la descripción
                    if (currentStep === 2 && aiData.descripcion) {
                        setTimeout(() => setCurrentStep(3), 1500);
                    }
                } else {
                    toast.error('No pude entender bien los detalles.', { id: tId });
                }
            } catch (error) {
                toast.error('Error al procesar la voz.', { id: tId });
            } finally {
                setIsProcessingVoice(false);
            }
        };

        recognition.start();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentStep < 4) {
            nextStep();
            return;
        }

        const maintenanceData = {
            ...formData,
            kilometraje: formData.kilometraje === '' ? 0 : Number(formData.kilometraje),
            costo_mano_obra: formData.costo_mano_obra === '' ? 0 : Number(formData.costo_mano_obra),
            costo_total: grandTotal
        };

        onSubmit(maintenanceData, selectedParts);
    };

    // Step Indicator Component
    const Steps = () => (
        <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center relative flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${currentStep === step
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                        : currentStep > step
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                        {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
                    </div>
                    <span className={`text-[10px] font-bold uppercase mt-2 tracking-tighter ${currentStep === step ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                        {step === 1 ? 'Vehículo' : step === 2 ? 'Trabajo' : step === 3 ? 'Repuestos' : 'Resumen'}
                    </span>
                    {step < 4 && (
                        <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${currentStep > step ? 'bg-green-500' : 'bg-slate-100'
                            }`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-[500px] flex flex-col">
            <Steps />

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-1">

                    {/* STEP 1: VEHICLE & DATE */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <Car className="w-5 h-5" /> ¿A qué vehículo le hiciste servicio?
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {vehicles?.map(v => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, vehiculo_id: v.id }))}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${formData.vehiculo_id === v.id
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200 text-slate-700 dark:text-slate-200'
                                                    }`}
                                            >
                                                <span className="font-bold truncate">{v.marca} {v.modelo}</span>
                                                <span className={`text-xs ${formData.vehiculo_id === v.id ? 'text-blue-100' : 'text-slate-400'}`}>Placa: {v.placa}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {!formData.vehiculo_id && <p className="text-xs text-red-500 flex items-center gap-1 mt-2 font-medium"><AlertCircle className="w-3 h-3" /> Por favor, selecciona un vehículo</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha del Servicio</label>
                                    <DatePicker
                                        selected={formData.fecha ? new Date(formData.fecha + 'T12:00:00') : null}
                                        onChange={(date) => setFormData(prev => ({ ...prev, fecha: date?.toISOString().split('T')[0] }))}
                                        dateFormat="dd 'de' MMMM, yyyy"
                                        locale="es"
                                        maxDate={new Date()}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kilometraje</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KM</div>
                                        <input
                                            type="number"
                                            name="kilometraje"
                                            value={formData.kilometraje}
                                            onChange={handleChange}
                                            placeholder="Ej: 45000"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: WORK DETAILS / VOICE */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-purple-600/20 relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-xl font-black mb-1 flex items-center gap-2 justify-center sm:justify-start">
                                            <Sparkles className="w-6 h-6 text-yellow-300" /> ¡Usa tu voz!
                                        </h3>
                                        <p className="text-purple-100 text-sm font-medium">Dicta el trabajo y la IA llenará todo por ti.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        disabled={isListening || isProcessingVoice}
                                        className={`px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-3 transition-all active:scale-95 ${isListening ? 'bg-white text-red-600 animate-pulse' : 'bg-white text-purple-600 hover:bg-yellow-300 hover:text-purple-900'
                                            }`}
                                    >
                                        {isListening ? (
                                            <> <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></div> Grabando... </>
                                        ) : (
                                            <> <Mic className="w-6 h-6" /> Pulsar para Dictar </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de Trabajo</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['Mantenimiento Preventivo', 'Reparación Correctiva', 'Inspección', 'Emergencia'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, tipo: type }))}
                                                className={`px-3 py-3 rounded-2xl border-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${formData.tipo === type
                                                    ? 'bg-slate-800 border-slate-800 text-white shadow-lg'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Descripción del Servicio</label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 dark:text-white font-medium text-lg leading-relaxed placeholder:text-slate-300"
                                        placeholder="Ej: Cambio de aceite, filtros y revisión de frenos traseros..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PARTS & RESOURCES */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Package className="w-6 h-6 text-orange-500" /> Repuestos e Insumos
                                </h3>
                                <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black">
                                    {selectedParts.length} ITEMS
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                                    <div className="sm:col-span-7">
                                        <select
                                            value={currentPartId}
                                            onChange={(e) => setCurrentPartId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        >
                                            <option value="">Buscar Repuesto...</option>
                                            {inventory?.map(p => (
                                                <option key={p.id} value={p.id} disabled={p.cantidad <= 0}>
                                                    {p.nombre} - Stock: {p.cantidad} - ${p.precio}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAddPartOpen(true)}
                                            className="w-full h-[48px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-all flex items-center justify-center group"
                                            title="Nuevo Repuesto"
                                        >
                                            <Package className="w-5 h-5 group-hover:text-blue-500" />
                                        </button>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <input
                                            type="number"
                                            value={currentPartQty}
                                            onChange={(e) => setCurrentPartQty(e.target.value)}
                                            min="1"
                                            placeholder="Cant."
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:outline-none font-bold text-center"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddPart}
                                        disabled={!currentPartId}
                                        className="sm:col-span-2 h-[48px] bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>

                                {selectedParts.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2 mt-4">
                                        {selectedParts.map(part => (
                                            <div key={part.id} className="flex justify-between items-center bg-white dark:bg-slate-700 p-4 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm animate-in scale-in-95">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white leading-tight">{part.nombre}</p>
                                                        <p className="text-xs text-slate-400 font-medium">Cant: {part.cantidad_usada} x ${part.precio}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-black text-slate-900 dark:text-slate-100">
                                                        ${(part.cantidad_usada * part.precio).toFixed(2)}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePart(part.id)}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-400 text-sm font-medium italic">¿Usaste algún repuesto nuevo o que tenías guardado?</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: MECHANIC & FINAL SUMMARY */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-500" /> Especialista / Mecánico
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAddMechanicOpen(true)}
                                            className="text-[10px] text-blue-600 font-black uppercase hover:underline"
                                        >
                                            + Nuevo
                                        </button>
                                    </label>
                                    <select
                                        name="mecanico_id"
                                        value={formData.mecanico_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                                    >
                                        <option value="">¿Quién hizo el trabajo?</option>
                                        {mechanics?.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre} - {m.especialidad}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-500" /> Mano de Obra ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="costo_mano_obra"
                                        value={formData.costo_mano_obra}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-black text-xl"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Resumen del Ticket</h4>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-medium">Repuestos Utilizados</span>
                                        <span className="font-black text-slate-300">${partsTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-medium">Mano de Obra</span>
                                        <span className="font-black text-slate-300">${parseFloat(formData.costo_mano_obra || 0).toFixed(2)}</span>
                                    </div>

                                    <div className="h-px bg-slate-800 my-4"></div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">TOTAL ESTIMADO</span>
                                            <span className="text-4xl font-black">${grandTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">VEHÍCULO</span>
                                            <span className="text-sm font-bold text-slate-300 text-right">
                                                {vehicles?.find(v => v.id === formData.vehiculo_id)?.marca} {vehicles?.find(v => v.id === formData.vehiculo_id)?.modelo}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="flex items-center gap-4 pt-8 pb-4">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-wider text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" /> Anterior
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={currentStep === 1 && !formData.vehiculo_id}
                        className={`flex-[2] py-4 rounded-3xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 ${currentStep === 4 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:opacity-50 disabled:grayscale`}
                    >
                        {currentStep === 4 ? (
                            <> <Save className="w-5 h-5" /> Finalizar y Guardar </>
                        ) : (
                            <> Continuar <ChevronRight className="w-5 h-5" /> </>
                        )}
                    </button>
                </div>
            </form>

            {/* Quick Add Modals */}
            <Modal
                isOpen={isQuickAddPartOpen}
                onClose={() => setIsQuickAddPartOpen(false)}
                title="Nuevo Repuesto"
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    <InventoryForm
                        onSubmit={handleQuickAddPart}
                        onCancel={() => setIsQuickAddPartOpen(false)}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isQuickAddMechanicOpen}
                onClose={() => setIsQuickAddMechanicOpen(false)}
                title="Nuevo Mecánico"
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    <MechanicForm
                        onSubmit={handleQuickAddMechanic}
                        onCancel={() => setIsQuickAddMechanicOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default MaintenanceForm;
