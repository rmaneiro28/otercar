import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { generateMaintenanceInsight } from '../../services/aiService';
import { toast } from 'sonner';

const AIRecommendations = ({ vehicle }) => {
    const { maintenance, addRecommendation, recommendations, addNotification, deleteRecommendation, inventory } = useData();
    const [loading, setLoading] = useState(false);

    // Filter recommendations for this vehicle
    const vehicleRecommendations = recommendations.filter(r => r.vehiculo_id === vehicle.id);
    const latestRecommendation = vehicleRecommendations[0]; // Assuming ordered by created_at desc

    const handleGenerateInsight = async () => {
        setLoading(true);
        try {
            // Get maintenance history for this vehicle
            const history = maintenance.filter(m => m.vehiculo_id === vehicle.id);

            // Call AI Service with INVENTORY
            const insight = await generateMaintenanceInsight(vehicle, history, inventory);

            // Save to database
            const newRec = {
                vehiculo_id: vehicle.id,
                contenido: JSON.stringify(insight),
                tipo: 'mantenimiento'
            };

            const { error } = await addRecommendation(newRec);

            if (error) throw error;

            // --- AUTOMATIC NOTIFICATION GENERATION ---
            const priority = insight.prioridad ? insight.prioridad.toLowerCase() : '';
            console.log('AI Insight Priority:', priority); // Debugging

            if (['alta', 'high', 'media', 'medium'].includes(priority)) {
                console.log('Generating Notification...');
                const notifType = (priority === 'alta' || priority === 'high') ? 'alert' : 'warning';

                const { error: notifError } = await addNotification({
                    titulo: `Alerta IA: ${insight.recomendacion}`,
                    mensaje: `Prioridad: ${insight.prioridad}. Estimado: ${insight.estimado}. Costo Est: $${insight.costo_estimado || '?'}`,
                    tipo: notifType,
                    leida: false
                });

                if (notifError) {
                    console.error('Notification Error:', notifError);
                    toast.error('Error al guardar la notificación');
                } else {
                    toast.success('⚠️ Alerta de Mantenimiento Generada');
                }
            } else {
                toast.success('Análisis completado');
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al generar el análisis.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!latestRecommendation) return;
        if (confirm('¿Estás seguro de eliminar este análisis?')) {
            const { error } = await deleteRecommendation(latestRecommendation.id);
            if (error) {
                toast.error('Error al eliminar');
            } else {
                toast.success('Análisis eliminado');
            }
        }
    };

    const parseContent = (content) => {
        try { return typeof content === 'string' ? JSON.parse(content) : content; } catch { return null; }
    };

    const recData = latestRecommendation ? parseContent(latestRecommendation.contenido) : null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900">IA Assistant + Presupuesto</h3>
                        <p className="text-xs text-indigo-600">Análisis Técnico y Financiero</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerateInsight}
                    disabled={loading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${loading
                            ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                        }`}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analizando...' : 'Nuevo Análisis'}
                </button>
            </div>

            {recData ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100 relative overflow-hidden">
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase
                                    ${recData.prioridad === 'Alta' ? 'bg-red-100 text-red-600' :
                                        recData.prioridad === 'Media' ? 'bg-orange-100 text-orange-600' :
                                            'bg-green-100 text-green-600'}`}>
                                    {recData.prioridad}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {recData.estimado}
                                </span>
                            </div>
                            {/* COST BADGE */}
                            {recData.costo_estimado > 0 && (
                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg border border-green-200 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Presupuesto Est.</p>
                                    <p className="text-lg font-black">${recData.costo_estimado}</p>
                                </div>
                            )}
                        </div>

                        <h4 className="font-bold text-slate-800 mb-2 text-lg">{recData.recomendacion}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{recData.detalle}</p>

                        {/* Suggested Parts */}
                        {recData.partes_sugeridas && recData.partes_sugeridas.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Repuestos Sugeridos (En Stock)</p>
                                <ul className="text-xs text-slate-700 space-y-1">
                                    {recData.partes_sugeridas.map((part, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            {part}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleDelete}
                                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                        </div>
                    </div>

                    {latestRecommendation && (
                        <p className="text-[10px] text-center text-slate-400">
                            Generado el {new Date(latestRecommendation.created_at).toLocaleDateString()} a las {new Date(latestRecommendation.created_at).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center py-6 text-slate-500">
                    <p className="text-sm">No hay análisis recientes.</p>
                    <p className="text-xs mt-1">Haz clic en "Nuevo Análisis" para obtener recomendaciones.</p>
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;
