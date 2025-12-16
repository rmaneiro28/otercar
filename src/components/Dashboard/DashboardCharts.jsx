import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useData } from '../../context/DataContext';

const DashboardCharts = () => {
    const { maintenance } = useData();

    // --- 1. Monthly Spending Trend (Last 6 Months) ---
    const getMonthlyData = () => {
        const data = [];
        const today = new Date();

        // Helper to safely parse cost
        const getCost = (m) => {
            const labor = parseFloat(m.costo_mano_obra) || 0;
            const total = parseFloat(m.costo_total) || 0;
            return Math.max(labor, total);
        };

        console.log('--- Calculation Start ---');

        for (let i = 5; i >= 0; i--) {
            // Get target month/year
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const targetMonth = d.getMonth();
            const targetYear = d.getFullYear();

            const monthName = d.toLocaleString('default', { month: 'short' });

            // Filter records for this month
            const monthlyRecords = maintenance.filter(m => {
                if (!m.fecha) return false;

                // Robust Date Parsing: Treat YYYY-MM-DD as simple date parts to avoid timezone shifts
                let recordYear, recordMonth;

                if (m.fecha.includes('T')) {
                    const dateObj = new Date(m.fecha);
                    recordYear = dateObj.getFullYear();
                    recordMonth = dateObj.getMonth();
                } else {
                    // Assume YYYY-MM-DD format which is typical for SQL date
                    const parts = m.fecha.split('-');
                    recordYear = parseInt(parts[0]);
                    recordMonth = parseInt(parts[1]) - 1; // 0-indexed
                }

                const match = recordYear === targetYear && recordMonth === targetMonth;
                if (match) console.log(`Match for ${monthName}:`, m.fecha, getCost(m));
                return match;
            });

            const monthlyTotal = monthlyRecords.reduce((sum, m) => sum + getCost(m), 0);

            data.push({
                name: monthName,
                total: monthlyTotal
            });
        }
        return data;
    };

    const monthlyData = getMonthlyData();

    // --- 2. Category Breakdown (Pie Chart) ---
    const getCategoryData = () => {
        const categories = {};

        maintenance.forEach(m => {
            const labor = parseFloat(m.costo_mano_obra) || 0;
            const total = parseFloat(m.costo_total) || 0;
            const cost = Math.max(labor, total);

            if (cost > 0) {
                const type = m.tipo || 'Otros';
                let category = type;
                if (type.includes('Preventivo') || type.includes('Correctivo')) category = 'Mantenimiento';
                if (type === 'Combustible') category = 'Combustible';

                categories[category] = (categories[category] || 0) + cost;
            }
        });

        return Object.keys(categories).map(key => ({
            name: key,
            value: categories[key]
        })); // Removed filter > 0 to see if categories exist
    };

    const categoryData = getCategoryData();
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    // Debug Logs
    console.log('--- Chart Debug ---');
    console.log('Records Found:', maintenance.length);
    console.log('Sample Record:', maintenance[0]);
    console.log('Monthly Data Calculated:', monthlyData);

    // No data checking
    if (maintenance.length === 0) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center col-span-1 lg:col-span-2 dash-chart-placeholder">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Aún no hay datos para las gráficas</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                        Registra tu primer mantenimiento o carga de combustible para ver cómo se comportan tus gastos aquí.
                    </p>
                </div>
            </div>
        );
    }

    // --- Custom Tooltip Component ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const isPie = !label; // Pie chart tooltips don't usually have a label passed the same way

            return (
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-xl text-white min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">
                        {isPie ? data.name : label}
                    </p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">
                            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        {isPie && (
                            <span className="text-xs text-slate-400 mb-1">
                                {((data.value / maintenance.reduce((sum, m) => sum + (parseFloat(m.costo_mano_obra) || parseFloat(m.costo_total) || 0), 0)) * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    {!isPie && <p className="text-[10px] text-slate-500 mt-1">Total del mes</p>}
                    {isPie && <p className="text-[10px] text-slate-500 mt-1">de gastos totales</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-bottom-5 duration-500">
            {/* Monthly Trend */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6">Gastos Mensuales (Últimos 6)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6">Gastos por Categoría</h3>
                <div className="h-64 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
