import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, Wrench, Users, Store, Settings, LogOut, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
    const { profile } = useAuth();
    const isTaller = profile?.rol === 'taller';

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Car, label: 'Vehículos', path: '/vehicles' },
        { icon: Users, label: 'Clientes', path: '/owners' },
        { icon: Wrench, label: 'Inventario', path: '/inventory' },
        { icon: FileText, label: 'Mantenimiento', path: '/maintenance' },
        { icon: Sparkles, label: 'Historial IA', path: '/ai-history' },
        { icon: Users, label: 'Mecánicos', path: '/mechanics' },
        { icon: Store, label: 'Tiendas', path: '/stores' },
    ];

    return (
        <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 border-r border-slate-800 dark:border-slate-800">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/Isotipo Blanco.png" alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        OterCar
                    </h1>
                    <p className="text-xs text-slate-400">Mantenimiento Vehicular</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                                item.path === '/settings' && 'settings-link'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>


            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
