import React from 'react';

import DashboardCharts from '../components/Dashboard/DashboardCharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Car, Wrench, AlertCircle, ShoppingBag, DollarSign, Package, Activity, Calendar } from 'lucide-react';
import Tutorial from '../components/Tutorial/Tutorial';

// --- Shared Components ---
// --- Shared Components ---
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const AgendaWidget = ({ title = "Agenda Próxima" }) => {
    const { documents, vehicles, owners, events, recommendations } = useData();

    // Aggregation Logic (Same as CalendarPage but filtered for upcoming)
    const upcomingEvents = React.useMemo(() => {
        const aggregated = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Docs
        documents.forEach(doc => {
            if (doc.fecha_vencimiento) {
                const d = parseISO(doc.fecha_vencimiento);
                if (isValid(d) && d >= today) {
                    aggregated.push({ date: d, title: `Vence: ${doc.tipo}`, subtitle: doc.titulo, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' });
                }
            }
        });

        // 2. Events
        events.forEach(ev => {
            const d = new Date(ev.fecha);
            if (isValid(d) && d >= today) {
                aggregated.push({ date: d, title: ev.titulo, subtitle: ev.descripcion || 'Evento', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' });
            }
        });

        // 3. AI Recs
        recommendations.forEach(rec => {
            try {
                const c = JSON.parse(rec.contenido);
                let d = null;
                if (c.fecha_estimada) d = parseISO(c.fecha_estimada);
                else if (c.estimado && c.estimado.match && c.estimado.match(/^\d{4}-\d{2}-\d{2}$/)) d = parseISO(c.estimado);

                if (d && isValid(d) && d >= today) {
                    aggregated.push({ date: d, title: 'Sugerencia IA', subtitle: c.recomendacion, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' });
                }
            } catch (e) { }
        });

        return aggregated.sort((a, b) => a.date - b.date).slice(0, 5);
    }, [documents, events, recommendations]);

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-full">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                {title}
            </h2>
            {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                    {upcomingEvents.map((ev, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className="flex flex-col items-center min-w-[3rem] bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{format(ev.date, 'MMM', { locale: es })}</span>
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{format(ev.date, 'dd')}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{ev.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ev.subtitle}</p>
                                {/* <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ev.color} mt-1 inline-block`}>
                                   {format(ev.date, 'p', { locale: es })}
                                </span> */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-slate-400">
                    <p className="text-sm">Nada pendiente para los próximos días.</p>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, subtext, advice }) => {
    const [showAdvice, setShowAdvice] = React.useState(false);

    return (
        <div
            className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 active:scale-95 cursor-pointer hover:shadow-md"
            onClick={() => setShowAdvice(!showAdvice)}
            title="Toca para ver consejos"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1">
                        {title}
                        {advice && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">?</span>}
                    </h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
                    {(trend || subtext) && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {trend && <span className={trend.includes('+') ? 'text-green-500' : 'text-slate-400'}>{trend} </span>}
                            {subtext}
                        </p>
                    )}
                </div>
            </div>

            {/* Advice Tooltip/Popover */}
            {showAdvice && advice && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold mb-1">💡 Consejo:</p>
                    {advice}
                </div>
            )}
        </div>
    );
};

// --- Personal Dashboard (Client Mode) ---
const PersonalDashboard = ({ vehicles, maintenance }) => {
    // KPI 1: Total Vehicles
    const myCarsCount = vehicles.length;

    // KPI 2: Total Maintenance Spend
    const totalSpend = maintenance.reduce((sum, m) => sum + (parseFloat(m.costo_total || 0) + parseFloat(m.costo_mano_obra || 0)), 0);

    // KPI 3: Fleet Health (Mock logic)
    const activeIssues = 0;
    const healthStatus = activeIssues === 0 ? 'Excelente' : 'Atención';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Mis Vehículos"
                    value={myCarsCount}
                    icon={Car}
                    color="bg-blue-600"
                    subtext="Registrados"
                    advice="Mantén los datos de kilometraje actualizados para recibir alertas precisas."
                />
                <StatCard
                    title="Gasto Acumulado"
                    value={`$${totalSpend.toFixed(2)} `}
                    icon={DollarSign}
                    color="bg-emerald-600"
                    subtext="En mantenimientos"
                    advice="Revisar el historial te ayuda a prever gastos futuros. ¡El preventivo es más barato que el correctivo!"
                />
                <StatCard
                    title="Estado General"
                    value={healthStatus}
                    icon={Activity}
                    color={activeIssues === 0 ? "bg-green-500" : "bg-amber-500"}
                    subtext="Salud de la flota"
                    advice={activeIssues === 0
                        ? "¡Todo en orden! Sigue haciendo los mantenimientos a tiempo."
                        : "Tienes alertas pendientes. Revisa las notificaciones para evitar daños mayores."}
                />
            </div>


            {/* Dashboard Charts & Agenda */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DashboardCharts />
                </div>
                <div>
                    <AgendaWidget title="Mi Agenda" />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    Mis Vehículos
                </h2>
                {vehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{vehicle.marca} {vehicle.modelo}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{vehicle.placa}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600">
                                        {vehicle.anio}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-2">
                                    <Activity className="w-3 h-3" />
                                    {vehicle.kilometraje} km
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-4">No tienes vehículos registrados aún.</p>
                )}
            </div>
        </div>
    );
};


// --- Workshop Dashboard (Business Mode) ---
const WorkshopDashboard = ({ vehicles, inventory, mechanics, maintenance, company }) => {
    // KPI 1: Active Fleet (Vehicles managed)
    const fleetSize = vehicles.length;
    const plan = company?.plan || 'free';
    const limit = company?.limit_vehicles === -1 ? Infinity : (company?.limit_vehicles || (plan === 'free' ? 1 : 3));
    const isLimitReached = limit !== Infinity && fleetSize >= limit;

    // KPI 2: Estimated Revenue (This month - Mocked for now based on all time or filtering dates)
    // For simplicity, showing total revenue from recorded maintenance
    const totalRevenue = maintenance.reduce((sum, m) => sum + (parseFloat(m.costo_total || 0) + parseFloat(m.costo_mano_obra || 0)), 0);

    // KPI 3: Low Stock Alerts
    const lowStockCount = inventory.filter(item => item.cantidad < 5).length;

    // KPI 4: Team Activity
    const mechanicCount = mechanics.length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Vehículos en Taller"
                    value={fleetSize}
                    icon={Car}
                    color={isLimitReached ? "bg-red-500" : "bg-blue-600"}
                    subtext={limit === Infinity ? "Plan Ilimitado" : `Límite: ${limit} `}
                />
                <StatCard
                    title="Ingresos Totales"
                    value={`$${totalRevenue.toFixed(2)} `}
                    icon={DollarSign}
                    color="bg-emerald-600"
                    subtext="Generados en servicios"
                />
                <StatCard
                    title="Alertas de Stock"
                    value={lowStockCount}
                    icon={AlertCircle}
                    color={lowStockCount > 0 ? "bg-red-500" : "bg-orange-500"}
                    subtext="Productos bajo mínimo"
                />
                <StatCard
                    title="Equipo de Trabajo"
                    value={mechanicCount}
                    icon={Wrench}
                    color="bg-purple-600"
                    subtext="Mecánicos activos"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agenda Widget */}
                <div>
                    <AgendaWidget />
                </div>

                {/* Low Stock Widget */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-500" />
                        Repuestos por Agotar
                    </h2>
                    {lowStockCount > 0 ? (
                        <div className="space-y-3">
                            {inventory.filter(i => i.cantidad < 5).slice(0, 5).map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                                    <span className="font-medium text-slate-700 dark:text-red-200">{item.nombre}</span>
                                    <span className="text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-lg">
                                        Quedan: {item.cantidad}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4 text-sm">Todo el inventario está en orden.</p>
                    )}
                </div>

                {/* Recent Maintenance Widget */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-purple-500" />
                        Últimos Servicios
                    </h2>
                    {maintenance.length > 0 ? (
                        <div className="space-y-4">
                            {maintenance.slice(0, 5).map(m => (
                                <div key={m.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white text-sm">{m.tipo}</p>
                                        <p className="text-xs text-slate-500">{new Date(m.fecha).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            ${(parseFloat(m.costo_total || 0) + parseFloat(m.costo_mano_obra || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4 text-sm">No hay servicios recientes.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { vehicles, inventory, mechanics, stores, maintenance, company } = useData();
    const { profile } = useAuth();
    const isTaller = profile?.rol === 'taller';

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isTaller ? 'Panel de Control - Taller' : 'Mi Panel Personal'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {isTaller
                        ? 'Gestión integral de tu negocio y flota.'
                        : 'Estado general de tus vehículos y gastos.'}
                </p>
            </div>

            {isTaller ? (
                <WorkshopDashboard
                    vehicles={vehicles}
                    inventory={inventory}
                    mechanics={mechanics}
                    maintenance={maintenance}
                    company={company}
                />
            ) : (
                <PersonalDashboard
                    vehicles={vehicles}
                    maintenance={maintenance}
                />
            )}

            <div className="mt-12">
                <Tutorial />
            </div>
        </div>
    );
};

export default Dashboard;
