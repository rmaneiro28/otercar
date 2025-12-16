import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Sparkles, Calendar, Car, Clock, Search, Filter, MessageSquare, History } from 'lucide-react';
import AIChat from '../components/AI/AIChat';

const AIHistory = () => {
    const { recommendations, vehicles } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');

    const getVehicleName = (id) => {
        const v = vehicles.find(v => v.id === id);
        return v ? `${v.marca} ${v.modelo} (${v.placa})` : 'Vehículo desconocido';
    };

    const parseContent = (content) => {
        try {
            return typeof content === 'string' ? JSON.parse(content) : content;
        } catch (e) {
            return null;
        }
    };

    const filteredRecommendations = recommendations.filter(rec => {
        const data = parseContent(rec.contenido);
        if (!data) return false;

        const matchesSearch =
            data.recomendacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getVehicleName(rec.vehiculo_id).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPriority = filterPriority === 'all' || data.prioridad === filterPriority;

        return matchesSearch && matchesPriority;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Centro de Inteligencia Artificial
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Historial de recomendaciones generadas por la IA.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar en recomendaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                </div>
                <div className="w-full md:w-48">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-slate-800 dark:text-white"
                        >
                            <option value="all">Todas las Prioridades</option>
                            <option value="Alta">Alta Prioridad</option>
                            <option value="Media">Media Prioridad</option>
                            <option value="Baja">Baja Prioridad</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredRecommendations.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                        <Sparkles className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-800 dark:text-white">No hay recomendaciones</h3>
                        <p className="text-slate-500 dark:text-slate-400">Genera nuevos análisis desde la sección de Mantenimiento.</p>
                    </div>
                ) : (
                    filteredRecommendations.map((rec) => {
                        const data = parseContent(rec.contenido);
                        return (
                            <div key={rec.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
                                        ${data.prioridad === 'Alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                    data.prioridad === 'Media' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                                {data.prioridad}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(rec.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(rec.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {data.recomendacion}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                            {data.detalle}
                                        </p>

                                        <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg w-fit">
                                            <Car className="w-4 h-4" />
                                            <span className="font-medium">{getVehicleName(rec.vehiculo_id)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AIHistory;
