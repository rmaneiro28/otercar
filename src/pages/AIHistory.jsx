import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Sparkles, Calendar, Car, Clock, Search, Filter, MessageSquare, History } from 'lucide-react';
import AIChat from '../components/AI/AIChat';

const AIHistory = () => {
    const { recommendations, vehicles } = useData();
    const [activeTab, setActiveTab] = useState('history'); // 'history' or 'chat'
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
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                        Centro de Inteligencia Artificial
                    </h1>
                    <p className="text-slate-500">Gestiona tus recomendaciones y consulta con el asistente.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${activeTab === 'history'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History className="w-4 h-4" />
                        Historial
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${activeTab === 'chat'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chatbot
                    </button>
                </div>
            </div>

            {activeTab === 'chat' ? (
                <div className="max-w-3xl mx-auto">
                    <AIChat />
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar en recomendaciones..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
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
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-slate-800">No hay recomendaciones</h3>
                                <p className="text-slate-500">Genera nuevos análisis desde la sección de Mantenimiento.</p>
                            </div>
                        ) : (
                            filteredRecommendations.map((rec) => {
                                const data = parseContent(rec.contenido);
                                return (
                                    <div key={rec.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
                                                ${data.prioridad === 'Alta' ? 'bg-red-100 text-red-600' :
                                                            data.prioridad === 'Media' ? 'bg-orange-100 text-orange-600' :
                                                                'bg-green-100 text-green-600'}`}>
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

                                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                                    {data.recomendacion}
                                                </h3>
                                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                    {data.detalle}
                                                </p>

                                                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-fit">
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
                </>
            )}
        </div>
    );
};

export default AIHistory;
