import React from 'react';
import { useData } from '../context/DataContext';
import { Car, Wrench, AlertCircle, ShoppingBag, DollarSign, Package } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const { vehicles, inventory, mechanics, stores } = useData();

    // Calculate low stock items (less than 5)
    const lowStockCount = inventory.filter(item => item.cantidad < 5).length;

    // Combine all items to generate recent activity
    const getAllActivity = () => {
        const activity = [
            ...vehicles.map(v => ({ ...v, type: 'vehicle', date: v.created_at, label: `Vehículo agregado: ${v.marca} ${v.modelo}` })),
            ...inventory.map(i => ({ ...i, type: 'inventory', date: i.created_at, label: `Repuesto agregado: ${i.nombre}` })),
            ...mechanics.map(m => ({ ...m, type: 'mechanic', date: m.created_at, label: `Mecánico agregado: ${m.nombre}` })),
            ...stores.map(s => ({ ...s, type: 'store', date: s.created_at, label: `Tienda agregada: ${s.nombre}` }))
        ];

        // Sort by date descending and take top 5
        return activity
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    };

    const recentActivity = getAllActivity();

    const stats = [
        {
            title: 'Vehículos',
            value: vehicles.length,
            icon: Car,
            color: 'bg-blue-500',
            trend: 'En flota'
        },
        {
            title: 'Repuestos',
            value: inventory.length,
            icon: Package,
            color: 'bg-orange-500',
            trend: `${lowStockCount} bajo stock`
        },
        {
            title: 'Valor Inventario',
            value: `$${inventory.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-green-500',
            trend: 'Total estimado'
        },
        {
            title: 'Mecánicos',
            value: mechanics.length,
            icon: Wrench,
            color: 'bg-purple-500',
            trend: 'De confianza'
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Bienvenido al sistema de gestión de mantenimiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h2>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'vehicle' ? 'bg-blue-500' :
                                            item.type === 'inventory' ? 'bg-orange-500' :
                                                item.type === 'mechanic' ? 'bg-purple-500' : 'bg-emerald-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(item.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <p>No hay actividad reciente para mostrar.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Estado de la Flota</h2>
                    {vehicles.length > 0 ? (
                        <div className="space-y-4">
                            {vehicles.slice(0, 3).map(vehicle => (
                                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                            <Car className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">{vehicle.marca} {vehicle.modelo}</p>
                                            <p className="text-xs text-slate-500">{vehicle.placa}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white text-slate-600 rounded-lg border border-slate-100">
                                        {vehicle.anio}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <p>Agrega vehículos para ver el estado de la flota.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
