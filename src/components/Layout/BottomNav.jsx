import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Wrench, Users, Store, Plus, Menu, X, Sparkles, FileText } from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const isTaller = profile?.rol === 'taller';
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const mainNavItems = [
        { icon: LayoutDashboard, label: 'Inicio', path: '/' },
        { icon: FileText, label: 'Manten.', path: '/maintenance' },
    ];

    const secondaryNavItems = [
        { icon: Car, label: 'Autos', path: '/vehicles' },
    ];

    const moreMenuLinks = [
        { icon: Wrench, label: 'Inventario', path: '/inventory' },
        { icon: Users, label: 'Mecánicos', path: '/mechanics' },
        { icon: Store, label: 'Tiendas', path: '/stores' },
        ...(isTaller ? [{ icon: Users, label: 'Propietarios', path: '/owners' }] : []),
        { icon: Sparkles, label: 'Historial IA', path: '/ai-history' },
    ];

    const handleAddClick = () => {
        navigate('/maintenance', { state: { openAddModal: true } });
    };

    return (
        <>
            {/* More Menu Overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMoreOpen(false)}>
                    <div
                        className="absolute bottom-20 right-4 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-2 space-y-1">
                            {moreMenuLinks.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMoreOpen(false)}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                                            isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                        )
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 flex justify-between items-end safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {/* Left Items */}
                {mainNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all duration-200',
                                isActive ? 'text-blue-600' : 'text-slate-400'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={clsx("w-6 h-6", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Central Add Button */}
                <div className="relative -top-5">
                    <button
                        onClick={handleAddClick}
                        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>

                {/* Right Items */}
                {secondaryNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all duration-200',
                                isActive ? 'text-blue-600' : 'text-slate-400'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={clsx("w-6 h-6", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* More Menu Button */}
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={clsx(
                        'flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl transition-all duration-200',
                        isMoreOpen ? 'text-blue-600' : 'text-slate-400'
                    )}
                >
                    {isMoreOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    <span className="text-[10px] font-medium">Menú</span>
                </button>
            </nav>
        </>
    );
};

export default BottomNav;
