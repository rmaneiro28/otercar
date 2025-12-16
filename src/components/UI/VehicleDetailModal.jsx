import { generateVehicleReport } from '../../services/pdfService';
import { useData } from '../../context/DataContext';
import WhatsAppButton from './WhatsAppButton';
import { useState } from 'react';
import { Hash, Gauge, User, FileText, Calendar, Clock, Activity, X } from 'lucide-react';

const VehicleDetailModal = ({ isOpen, onClose, vehicle, healthScore }) => {
    const { maintenance, owners } = useData();
    const [imageError, setImageError] = useState(false);

    if (!isOpen || !vehicle) return null;

    const vehicleMaintenance = maintenance.filter(m => m.vehiculo_id === vehicle.id);
    const owner = owners.find(o => o.id === vehicle.propietario_id);

    const handleDownloadPDF = () => {
        generateVehicleReport(vehicle, vehicleMaintenance);
    };

    // Construct a search query for the car image
    const searchQuery = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} ${vehicle.color} car`;
    const imageUrl = `https://tse4.mm.bing.net/th?mkt=es-ES&q=${encodeURIComponent(searchQuery)}&w=800&h=600&c=7&rs=1`;

    const getHealthColor = (score) => {
        if (score >= 90) return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (score >= 70) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    const healthColorClass = getHealthColor(healthScore);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">

                {/* Header with Image Background */}
                <div className="relative h-64 bg-slate-900 flex-shrink-0 group">
                    {/* Fallback pattern if image fails */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-100"></div>

                    {!imageError ? (
                        <img
                            src={imageUrl}
                            alt={`${vehicle.marca} ${vehicle.modelo}`}
                            className="absolute inset-0 w-full h-full object-cover object-center opacity-100 transition-opacity duration-500"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <Activity className="w-32 h-32 text-white" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

                    {/* BUTTONS CONTAINER */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 text-sm font-medium"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Exportar PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-10">
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded uppercase tracking-wider border border-white/10">
                                        {vehicle.anio}
                                    </span>
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded uppercase tracking-wider border border-white/10">
                                        {vehicle.color}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold text-white tracking-tight mb-1">
                                    {vehicle.marca} {vehicle.modelo}
                                </h2>
                                <p className="text-slate-300 font-mono flex items-center gap-2">
                                    <span className="opacity-60">VIN:</span> {vehicle.vin || 'No registrado'}
                                </p>
                            </div>

                            <div className={`hidden md:flex flex-col items-end px-4 py-2 rounded-xl border backdrop-blur-md ${healthColorClass}`}>
                                <span className="text-xs font-bold uppercase opacity-80 mb-1">Estado de Salud</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold">{healthScore}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950/50">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                                <Hash className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Placa</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{vehicle.placa}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                                <Gauge className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Kilometraje</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">
                                {vehicle.kilometraje?.toLocaleString() || 0} <span className="text-sm font-normal text-slate-500">km</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                                <User className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Propietario</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <p className="text-lg font-bold text-slate-800 dark:text-white truncate">
                                        {owner?.nombre_completo || 'Sin asignar'}
                                    </p>
                                    {owner?.email && <span className="text-xs text-slate-500 hidden sm:inline">{owner.email}</span>}
                                </div>
                                {owner?.telefono && (
                                    <WhatsAppButton
                                        phone={owner.telefono}
                                        message={`Hola ${owner.nombre_completo}, te escribo desde OterCar sobre tu vehículo ${vehicle.marca} ${vehicle.modelo} (${vehicle.placa}).`}
                                        compact={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Maintenance History */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Historial de Mantenimiento
                        </h3>

                        {vehicleMaintenance.length > 0 ? (
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pb-2">
                                {vehicleMaintenance.map((record) => (
                                    <div key={record.id} className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500"></div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white text-base">{record.tipo}</h4>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(record.fecha + 'T12:00:00').toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                                                {record.descripcion}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs font-medium">
                                                {record.kilometraje && (
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        <Gauge className="w-3 h-3" />
                                                        {record.kilometraje.toLocaleString()} km
                                                    </span>
                                                )}
                                                {record.costo_total > 0 && (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                                                        ${record.costo_total}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No hay registros de mantenimiento</p>
                                <p className="text-sm text-slate-400 mt-1">Los servicios realizados aparecerán aquí.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VehicleDetailModal;
