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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
                    <p className="text-slate-500">
                        {step === 1 ? 'Elige cómo quieres usar OterCar' : 'Completa tus datos'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Elige tu plan</h3>

                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Personal FREE */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'free')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">GRATIS</div>
                                <h4 className="font-bold text-slate-800">Básico</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-slate-800">$0</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Para empezar</p>
                                <ul className="text-xs text-slate-600 space-y-1">
                                    <li>• 1 Vehículo</li>
                                    <li>• Sin IA</li>
                                </ul>
                            </button>

                            {/* Personal STANDARD */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'standard')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                                <h4 className="font-bold text-slate-800">Estándar</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-blue-600">$9</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Con IA básica</p>
                                <ul className="text-xs text-slate-600 space-y-1">
                                    <li>• 3 Vehículos</li>
                                    <li>• IA Básica</li>
                                </ul>
                            </button>

                            {/* Personal PREMIUM */}
                            <button
                                onClick={() => handlePlanSelect('usuario', 'premium')}
                                className="text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all relative"
                            >
                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">FULL</div>
                                <h4 className="font-bold text-slate-800">Premium</h4>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-purple-600">$19</span>
                                    <span className="text-slate-400 text-xs">/mes</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Todo incluido</p>
                                <ul className="text-xs text-slate-600 space-y-1">
                                    <li>• Ilimitado</li>
                                    <li>• IA Avanzada</li>
                                </ul>
                            </button>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <button
                                onClick={() => handlePlanSelect('taller', 'taller')}
                                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center gap-4"
                            >
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Soy un Taller Mecánico</h4>
                                    <p className="text-xs text-slate-500">Gestión de clientes, flotas y órdenes de trabajo ($29/mes)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm mb-4 flex items-center justify-between">
                            <span>Plan: <strong>{plan === 'taller' ? 'Taller Mecánico' : `Personal ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}</strong></span>
                            <button type="button" onClick={() => setStep(1)} className="text-blue-800 hover:underline text-xs">Cambiar</button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo {role === 'taller' && '(o Nombre del Taller)'}</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder={role === 'taller' ? "Taller Mecánico Express" : "Juan Pérez"}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                            {loading ? 'Cargando...' : 'Completar Registro'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-slate-500">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-emerald-600 font-medium hover:underline">
                        Inicia Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
