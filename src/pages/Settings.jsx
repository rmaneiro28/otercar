import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Lock, Bell, Moon, Sun, Globe, Shield, CreditCard, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
            if (error) throw error;
            toast.success('Contraseña actualizada correctamente');
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Error al actualizar contraseña: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                <p className="text-slate-500">Administra tus preferencias y seguridad.</p>
            </div>

            <div className="grid gap-6">
                {/* Security Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Seguridad</h2>
                            <p className="text-sm text-slate-500">Cambiar contraseña</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>
                </div>

                {/* Subscription Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Suscripción</h2>
                            <p className="text-sm text-slate-500">Gestiona tu plan y facturación</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Plan Actual</p>
                            <p className="text-xl font-bold text-slate-800 capitalize">{company?.plan || 'Free'}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {company?.plan === 'free' ? '$0/mes' :
                                    company?.plan === 'standard' ? '$9/mes' :
                                        company?.plan === 'premium' ? '$19/mes' : '$29/mes'}
                            </p>
                        </div>
                        <button
                            onClick={() => toast.info('Funcionalidad de cambio de plan próximamente')}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                            Cambiar Plan
                        </button>
                    </div>
                </div>

                {/* Preferences Section (Mock) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Preferencias</h2>
                            <p className="text-sm text-slate-500">Personaliza tu experiencia</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-slate-500" />
                                <div>
                                    <p className="font-medium text-slate-700">Notificaciones por Correo</p>
                                    <p className="text-xs text-slate-500">Recibe alertas importantes en tu email</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-slate-500" />
                                <div>
                                    <p className="font-medium text-slate-700">Modo Oscuro</p>
                                    <p className="text-xs text-slate-500">Cambiar apariencia de la interfaz</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
