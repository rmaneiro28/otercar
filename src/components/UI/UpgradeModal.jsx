import React from 'react';
import { X, Check, Star, Zap } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, currentPlan }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Zap className="w-6 h-6 text-yellow-300" fill="currentColor" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">¡Has alcanzado el límite de tu plan!</h2>
                        <p className="text-blue-100">Actualiza ahora y desbloquea todo el potencial de OterCar.</p>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Standard Plan */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group relative">
                            {currentPlan === 'free' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Recomendado
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Plan Estándar</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">$9</span>
                                <span className="text-slate-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Hasta 3 Vehículos</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Historial de Mantenimiento</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Recordatorios Básicos</span>
                                </li>
                            </ul>
                            <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Elegir Estándar
                            </button>
                        </div>

                        {/* Premium Plan */}
                        <div className={`border rounded-xl p-6 transition-all group relative ${currentPlan === 'standard' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10'}`}>
                            <div className="absolute top-4 right-4">
                                <Star className={`w-5 h-5 ${currentPlan === 'standard' ? 'text-blue-500 fill-blue-500' : 'text-slate-300 group-hover:text-purple-500 transition-colors'}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Plan Premium</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">$19</span>
                                <span className="text-slate-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-blue-500" />
                                    <span><strong>Vehículos Ilimitados</strong></span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-blue-500" />
                                    <span>Asistente IA Avanzado</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-blue-500" />
                                    <span>Soporte Prioritario</span>
                                </li>
                            </ul>
                            <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all transform group-hover:-translate-y-0.5">
                                Obtener Premium
                            </button>
                        </div>

                    </div>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        ¿Necesitas un plan para tu Taller Mecánico? <button className="text-blue-500 hover:underline">Ver planes para empresas</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
