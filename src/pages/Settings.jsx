import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Lock, Bell, Moon, Sun, Globe, Shield, CreditCard, Settings as SettingsIcon, Monitor } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const { company, addVehicle, addClient, addPart, addMechanic, addStore } = useData();
    const { theme, toggleTheme } = useTheme();
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración</h1>
                <p className="text-slate-500 dark:text-slate-400">Administra tus preferencias y seguridad.</p>
            </div>

            <div className="grid gap-6">
                {/* Security Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Seguridad</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Cambiar contraseña</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Suscripción</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona tu plan y facturación</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-transparent dark:border-slate-700">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Plan Actual</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white capitalize">{company?.plan || 'Free'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {company?.plan === 'free' ? '$0/mes' :
                                    company?.plan === 'standard' ? '$9/mes' :
                                        company?.plan === 'premium' ? '$19/mes' : '$29/mes'}
                            </p>
                        </div>
                        <button
                            onClick={() => toast.info('Funcionalidad de cambio de plan próximamente')}
                            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Cambiar Plan
                        </button>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Apariencia</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza el tema</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> : <Sun className="w-5 h-5 text-slate-500" />}
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200">Modo Oscuro</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Cambiar entre tema claro y oscuro</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* General Configuration Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Configuración General</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Preferencias del sistema</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                    <th className="py-3 px-4 font-medium">Configuración</th>
                                    <th className="py-3 px-4 font-medium">Valor</th>
                                    <th className="py-3 px-4 font-medium">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Tema por defecto</td>
                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">{theme === 'dark' ? 'Oscuro' : 'Claro'}</td>
                                    <td className="py-3 px-4">
                                        <button onClick={toggleTheme} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Cambiar</button>
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Idioma</td>
                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Español</td>
                                    <td className="py-3 px-4">
                                        <button className="text-slate-400 dark:text-slate-600 cursor-not-allowed font-medium">Cambiar</button>
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Notificaciones</td>
                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Activadas</td>
                                    <td className="py-3 px-4">
                                        <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Configurar</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Data Management Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Gestión de Datos</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Importar y exportar información masiva</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-medium text-slate-800 dark:text-white mb-2">Descargar Plantilla</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Descarga el formato Excel para llenar tus datos de clientes, vehículos e inventario.
                            </p>
                            <button
                                onClick={() => {
                                    import('../utils/excelHandler').then(module => {
                                        module.generateTemplate();
                                        toast.success('Plantilla descargada');
                                    });
                                }}
                                className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" /> {/* Using CreditCard as placeholder icon if Download not available */}
                                Descargar Excel
                            </button>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-medium text-slate-800 dark:text-white mb-2">Importar Datos</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Sube tu archivo Excel completado para registrar datos masivamente.
                            </p>
                            <label className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20">
                                <SettingsIcon className="w-4 h-4" /> {/* Using SettingsIcon as placeholder */}
                                Subir Archivo
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        const toastId = toast.loading('Procesando archivo...');
                                        try {
                                            const module = await import('../utils/excelHandler');
                                            // We need to implement processImport in excelHandler first, but for now we can parse
                                            const data = await module.parseImportFile(file);
                                            console.log('Parsed Data:', data);

                                            // TODO: Call actual import logic here
                                            // await module.processImport(data, { addClient, addVehicle, ... });

                                            toast.success('Archivo procesado (Ver consola)', { id: toastId });
                                        } catch (error) {
                                            console.error(error);
                                            toast.error('Error al procesar archivo', { id: toastId });
                                        }
                                        e.target.value = ''; // Reset input
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
