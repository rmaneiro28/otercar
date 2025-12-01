import React, { useState } from 'react';
import { analyzeVehicleData } from '../../services/aiService';
import { Bot, Send, Loader } from 'lucide-react';

const MaintenanceAssistant = ({ vehicle }) => {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        try {
            const result = await analyzeVehicleData(vehicle, question);
            setResponse(result);
        } catch (error) {
            setResponse('Error analyzing data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Asistente IA</h3>
                    <p className="text-xs text-slate-500">Experto en mantenimiento</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-50 min-h-[100px] mb-4 text-sm text-slate-600 whitespace-pre-wrap">
                {response || "Hola, soy tu asistente de mantenimiento. ¿En qué puedo ayudarte hoy con tu vehículo?"}
            </div>

            <form onSubmit={handleAsk} className="relative">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ej: ¿Cuándo debo cambiar el aceite?"
                    className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    );
};

export default MaintenanceAssistant;
