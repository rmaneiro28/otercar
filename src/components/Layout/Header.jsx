import React, { useState } from 'react';
import { Bell, Search, User, Menu, LogOut, Settings, UserCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

const Header = () => {
    const { user, profile, signOut } = useAuth();
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, vehicles, inventory, mechanics } = useData();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ vehicles: [], inventory: [], mechanics: [] });
    const [showSearch, setShowSearch] = useState(false);

    const unreadCount = notifications ? notifications.filter(n => !n.leida).length : 0;

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 1) {
            const lowerQ = query.toLowerCase();
            const foundVehicles = vehicles?.filter(v =>
                v.marca.toLowerCase().includes(lowerQ) ||
                v.modelo.toLowerCase().includes(lowerQ) ||
                v.placa.toLowerCase().includes(lowerQ)
            ).slice(0, 3) || [];

            const foundInventory = inventory?.filter(i =>
                i.nombre.toLowerCase().includes(lowerQ) ||
                i.codigo?.toLowerCase().includes(lowerQ)
            ).slice(0, 3) || [];

            const foundMechanics = mechanics?.filter(m =>
                m.nombre.toLowerCase().includes(lowerQ)
            ).slice(0, 3) || [];

            setSearchResults({ vehicles: foundVehicles, inventory: foundInventory, mechanics: foundMechanics });
            setShowSearch(true);
        } else {
            setShowSearch(false);
        }
    };

    return (
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
            {/* Mobile Branding */}
            <div className="flex md:hidden items-center gap-2 mr-4">
                <img src="/Isotipo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <span className="font-extrabold text-slate-800 dark:text-white tracking-tight">Oter<span className="text-blue-600">Car</span></span>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-xl relative">
                <div className="relative w-full max-w-[200px] md:max-w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        onFocus={() => searchQuery.length > 1 && setShowSearch(true)}
                        onBlur={() => setTimeout(() => setShowSearch(false), 200)} // Delay to allow click
                        placeholder="Buscar vehículo, repuesto..."
                        className="w-full pl-9 md:pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    />

                    {/* Search Results Dropdown */}
                    {showSearch && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                            {/* Vehicles Section */}
                            {searchResults.vehicles.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase px-2 mb-1">Vehículos</h4>
                                    {searchResults.vehicles.map(v => (
                                        <Link key={v.id} to="/vehicles" className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{v.marca} {v.modelo}</p>
                                            <p className="text-xs text-slate-500">{v.placa}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Inventory Section */}
                            {searchResults.inventory.length > 0 && (
                                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase px-2 mb-1">Inventario</h4>
                                    {searchResults.inventory.map(i => (
                                        <Link key={i.id} to="/inventory" className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{i.nombre}</p>
                                            <p className="text-xs text-slate-500">{i.codigo || 'Sin código'}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {Object.values(searchResults).every(arr => arr.length === 0) && (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Invisible Backdrop for Click Outside */}
            {(showNotifications || showUserMenu) && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                        setShowNotifications(false);
                        setShowUserMenu(false);
                    }}
                ></div>
            )}

            <div className="flex items-center gap-3 md:gap-6 z-50">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowUserMenu(false);
                        }}
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
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800 dark:text-white">Notificaciones</h3>
                                <button
                                    onClick={markAllNotificationsAsRead}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
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
                                            className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.leida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.tipo === 'alert' ? 'bg-red-500' :
                                                    notif.tipo === 'warning' ? 'bg-amber-500' :
                                                        notif.tipo === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}></div>
                                                <div>
                                                    <h4 className={`text-sm text-slate-800 dark:text-white ${!notif.leida ? 'font-bold' : 'font-medium'}`}>{notif.titulo}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.mensaje}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
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
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200 dark:border-slate-700"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                {profile?.nombre_completo || user?.email}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.rol || 'Usuario'}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-slate-400 dark:text-slate-300" />
                        </div>
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 md:hidden">
                                <p className="text-sm font-semibold text-slate-700 dark:text-white">{profile?.nombre_completo || user?.email}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.rol || 'Usuario'}</p>
                            </div>
                            <div className="p-2">
                                <Link
                                    to="/profile"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <UserCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Mi Perfil</span>
                                </Link>
                                <Link
                                    to="/settings"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="text-sm font-medium">Configuración</span>
                                </Link>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                <button
                                    onClick={signOut}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
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
