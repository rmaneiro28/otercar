import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Car, Wrench, AlertCircle, ShoppingBag, DollarSign, Package } from 'lucide-react';
import Tutorial from '../components/Tutorial/Tutorial';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors duration-300">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
            {trend && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const { vehicles, inventory, mechanics, stores, company } = useData();
    const { profile } = useAuth();
    console.log('Dashboard: profile loaded', profile);

    // Calculate low stock items (less than 5)
    const lowStockCount = inventory.filter(item => item.cantidad < 5).length;

    // Plan Limits
    const plan = company?.plan || 'free';

    // Use DB limit if available, otherwise fallback to hardcoded defaults (for backward compatibility)
    let dbLimit = company?.limit_vehicles;

    // Logic: If dbLimit is present, use it. If it's -1, it's Infinity.
    // If dbLimit is null/undefined, fallback to old plan logic.
    let vehicleLimit;

    if (dbLimit !== undefined && dbLimit !== null) {
        vehicleLimit = dbLimit === -1 ? Infinity : dbLimit;
    } else {
        vehicleLimit = plan === 'free' ? 1 : plan === 'standard' ? 3 : Infinity;
    }
    const vehicleLimitText = vehicleLimit === Infinity ? 'Ilimitado' : `${vehicles.length} / ${vehicleLimit}`;
    const isLimitReached = vehicleLimit !== Infinity && vehicles.length >= vehicleLimit;

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
            color: isLimitReached ? 'bg-red-500' : 'bg-blue-500',
            trend: `Plan: ${vehicleLimitText}`
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Bienvenido al sistema de {profile?.rol === 'taller' ? 'tu Taller' : 'gestión personal'}.
                    {/* We could fetch company name if we had it in profile, but we have empresa_id */}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 dashboard-stats">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Actividad Reciente</h2>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'vehicle' ? 'bg-blue-500' :
                                        item.type === 'inventory' ? 'bg-orange-500' :
                                            item.type === 'mechanic' ? 'bg-purple-500' : 'bg-emerald-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                            <p>No hay actividad reciente para mostrar.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Estado de la Flota</h2>
                    {vehicles.length > 0 ? (
                        <div className="space-y-4">
                            {vehicles.slice(0, 3).map(vehicle => (
                                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Car className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{vehicle.marca} {vehicle.modelo}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{vehicle.placa}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-600">
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

            <Tutorial />
        </div>
    );
};

export default Dashboard;
