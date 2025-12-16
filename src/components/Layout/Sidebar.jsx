import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, Wrench, Users, Store, Settings, LogOut, FileText, Sparkles, Fuel, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
    const { profile, signOut } = useAuth();
    const isTaller = profile?.rol === 'taller';

    const navGroups = [
        {
            title: 'Principal',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
            ]
        },
        {
            title: 'Flota y Clientes',
            items: [
                { icon: Car, label: 'Vehículos', path: '/vehicles' },
                ...(isTaller ? [
                    { icon: Users, label: 'Clientes', path: '/owners' },
                    { icon: Users, label: 'Mecánicos', path: '/mechanics' }
                ] : [])
            ]
        },
        {
            title: 'Operaciones',
            items: [
                { icon: FileText, label: 'Mantenimiento', path: '/maintenance' },
                ...(isTaller ? [] : [
                    { icon: FileText, label: 'Documentación', path: '/documents' },
                    { icon: Fuel, label: 'Combustible', path: '/fuel' }
                ]),
                { icon: CalendarIcon, label: 'Agenda', path: '/calendar' },
            ]
        },
        {
            title: 'Gestión',
            items: [
                { icon: Wrench, label: 'Inventario', path: '/inventory' },
                { icon: Store, label: 'Tiendas', path: '/stores' },
                { icon: Sparkles, label: 'Historial IA', path: '/ai-history' },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 border-r border-slate-200 dark:border-slate-800">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-blue-600 dark:bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/Isotipo Blanco.png" alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        OterCar
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mantenimiento Vehicular</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {navGroups.map((group, groupIndex) => (
                    group.items.length > 0 && (
                        <div key={groupIndex}>
                            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm',
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                                            )
                                        }
                                    >
                                        <item.icon className={clsx(
                                            "w-4 h-4 transition-transform group-hover:scale-110",
                                            // Make icons slightly colored when active for nice touch
                                        )} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </nav>


            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
