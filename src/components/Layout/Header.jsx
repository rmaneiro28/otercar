import React, { useState } from 'react';
import { Bell, Search, User, Menu, LogOut, Settings, UserCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

const Header = () => {
    const { user, profile, signOut } = useAuth();
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const unreadCount = notifications ? notifications.filter(n => !n.leida).length : 0;

    return (
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative w-full max-w-[200px] md:max-w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-9 md:pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <Bell className="w-5 h-5 md:w-6 md:h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">Notificaciones</h3>
                                <button
                                    onClick={markAllNotificationsAsRead}
                                    className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                                >
                                    Marcar leídas
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications && notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markNotificationAsRead(notif.id)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.leida ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.tipo === 'alert' ? 'bg-red-500' :
                                                    notif.tipo === 'warning' ? 'bg-amber-500' :
                                                        notif.tipo === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}></div>
                                                <div>
                                                    <h4 className={`text-sm text-slate-800 ${!notif.leida ? 'font-bold' : 'font-medium'}`}>{notif.titulo}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">{notif.mensaje}</p>
                                                    <p className="text-[10px] text-slate-400 mt-2">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No tienes notificaciones
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-slate-700">{profile?.nombre_completo || user?.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{profile?.rol || 'Usuario'}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                        </div>
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                            <div className="p-4 border-b border-slate-100 md:hidden">
                                <p className="text-sm font-semibold text-slate-700">{profile?.nombre_completo || user?.email}</p>
                                <p className="text-xs text-slate-500 capitalize">{profile?.rol || 'Usuario'}</p>
                            </div>
                            <div className="p-2">
                                <Link
                                    to="/profile"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <UserCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Mi Perfil</span>
                                </Link>
                                <Link
                                    to="/settings"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="text-sm font-medium">Configuración</span>
                                </Link>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button
                                    onClick={signOut}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
