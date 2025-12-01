import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { generateMaintenanceInsight } from '../../services/aiService';
import { toast } from 'sonner';

const AIRecommendations = ({ vehicle }) => {
    const { maintenance, addRecommendation, recommendations } = useData();
    const [loading, setLoading] = useState(false);

    // Filter recommendations for this vehicle
    const vehicleRecommendations = recommendations.filter(r => r.vehiculo_id === vehicle.id);
    const latestRecommendation = vehicleRecommendations[0]; // Assuming ordered by created_at desc

    const handleGenerateInsight = async () => {
        setLoading(true);
        try {
            // Get maintenance history for this vehicle
            const history = maintenance.filter(m => m.vehiculo_id === vehicle.id);

            // Call AI Service
            const insight = await generateMaintenanceInsight(vehicle, history);

            // Save to database
            const newRec = {
                vehiculo_id: vehicle.id,
                contenido: JSON.stringify(insight),
                tipo: 'mantenimiento'
            };

            const { error } = await addRecommendation(newRec);

            if (error) throw error;

            toast.success('Análisis completado con éxito');
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el análisis. Verifica que Ollama esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    const parseContent = (content) => {
        try {
            return typeof content === 'string' ? JSON.parse(content) : content;
        } catch (e) {
            return null;
        }
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
                        <h3 className="font-bold text-indigo-900">IA Assistant</h3>
                        <p className="text-xs text-indigo-600">Powered by Llama 3</p>
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
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase
                                ${recData.prioridad === 'Alta' ? 'bg-red-100 text-red-600' :
                                    recData.prioridad === 'Media' ? 'bg-orange-100 text-orange-600' :
                                        'bg-green-100 text-green-600'}`}>
                                Prioridad {recData.prioridad}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Estimado: {recData.estimado}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{recData.recomendacion}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{recData.detalle}</p>
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
