import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Wrench } from 'lucide-react';

const Register = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Role Selection, 2: Form
    const [role, setRole] = useState(''); // 'usuario' or 'taller'
    const [plan, setPlan] = useState('free'); // 'free', 'standard', 'premium', 'taller'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePlanSelect = (selectedRole, selectedPlan) => {
        setRole(selectedRole);
        setPlan(selectedPlan);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error } = await signUp(email, password, fullName, role, plan);
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            alert('Registro exitoso! Por favor inicia sesión.');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-slate-700/50 relative z-10 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 group hover:scale-105 transition-transform duration-300">
                        <img src="/Isotipo Blanco.png" alt="OterCar Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        Oter<span className="text-emerald-500">Car</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {step === 1 ? 'Elige tu plan ideal' : 'Completa tu registro'}
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-emerald-500' : 'w-4 bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-emerald-500' : 'w-4 bg-slate-200 dark:bg-slate-700'}`}></div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Elige tu plan</h3>

                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Personal FREE */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'free')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">GRATIS</div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Básico</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">$0</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Para empezar</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                    <li>• 1 Vehículo</li>
                                    <li>• Sin IA</li>
                                </ul>
                            </button>

                            {/* Personal STANDARD */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'standard')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Estándar</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">$9</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Con IA básica</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                    <li>• 3 Vehículos</li>
                                    <li>• IA Básica</li>
                                </ul>
                            </button>

                            {/* Personal PREMIUM */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'premium')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">FULL</div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Premium</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">$19</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Todo incluido</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                    <li>• Ilimitado</li>
                                    <li>• IA Avanzada</li>
                                </ul>
                            </button>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                            <button
                                onClick={() => handlePlanSelect('taller', 'taller')}
                                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all flex items-center gap-4"
                            >
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">Soy un Taller Mecánico</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de clientes, flotas y órdenes de trabajo ($29/mes)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-2xl text-sm mb-6 flex items-center justify-between border border-blue-100 dark:border-blue-800/50">
                                <span>Plan seleccionado: <strong>{plan === 'taller' ? 'Taller Mecánico' : `Personal ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}</strong></span>
                                <button type="button" onClick={() => setStep(1)} className="text-blue-800 dark:text-blue-400 font-bold hover:underline text-xs">Cambiar</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo {role === 'taller' && '(o Nombre del Taller)'}</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                    placeholder={role === 'taller' ? "Taller Mecánico Express" : "Juan Pérez"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-bold shadow-lg shadow-emerald-600/25 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {loading ? 'Creando cuenta...' : 'Completar Registro'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                        Inicia Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
