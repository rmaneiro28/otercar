import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Shield, Mail, Calendar, Edit2, Save, X, Camera } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Profile = () => {
    const { user, profile } = useAuth();
    const { company } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: profile?.nombre_completo || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    if (!user || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('perfiles')
                .update({ nombre_completo: formData.nombre_completo })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            setIsEditing(false);
            // Ideally reload profile context here, but for now page reload works or context update
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mi Perfil</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona tu información personal.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => {
                            setFormData({ nombre_completo: profile.nombre_completo });
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium shadow-sm"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar
                    </button>
                )}
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg inline-block transition-colors duration-300">
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden">
                                    {profile.url_avatar ? (
                                        <img src={profile.url_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16" />
                                    )}
                                </div>
                            </div>
                            {isEditing && (
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.nombre_completo}
                                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{profile.nombre_completo}</h2>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                                    <Shield className="w-4 h-4" />
                                    <span className="capitalize">{profile.rol}</span>
                                </div>
                            </div>

                            <div className="grid gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Correo Electrónico</p>
                                        <p className="text-slate-800 dark:text-white">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Empresa / Plan</p>
                                        <p className="text-slate-800 dark:text-white font-medium">
                                            {company?.nombre || 'Cargando...'}
                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                                                {company?.plan || 'Free'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Miembro desde</p>
                                        <p className="text-slate-800 dark:text-white">
                                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
