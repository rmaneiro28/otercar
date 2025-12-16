import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [owners, setOwners] = useState([]); // New state for owners (users)
    const [inventory, setInventory] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [stores, setStores] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch data when user changes
    useEffect(() => {
        if (user && profile?.empresa_id) {
            fetchData();
        } else {
            setCompany(null);
            setVehicles([]);
            setOwners([]);
            setInventory([]);
            setMechanics([]);
            setStores([]);
            setMaintenance([]);
            setRecommendations([]);
            setNotifications([]);
            setLoading(false);
        }
    }, [user, profile]);

    const fetchData = async () => {
        setLoading(true);
        const empresaId = profile?.empresa_id;
        if (!empresaId) return;

        try {
            // Fetch company details first to get the plan
            const { data: companyData, error: companyError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            if (companyData) setCompany(companyData);

            const [vehRes, ownerRes, invRes, mechRes, storeRes, maintRes, recRes, notifRes] = await Promise.all([
                supabase.from('vehiculos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('propietarios').select('*').eq('empresa_id', empresaId).order('nombre_completo', { ascending: true }), // Fetch clients (propietarios)
                supabase.from('inventario').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('mecanicos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('tiendas').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('mantenimientos').select('*').eq('empresa_id', empresaId).order('fecha', { ascending: false }),
                supabase.from('recomendaciones_ia').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('notificaciones').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
            ]);

            if (vehRes.error) throw vehRes.error;
            if (ownerRes.error && ownerRes.error.code !== '42P01') console.warn('Error fetching owners:', ownerRes.error);
            if (invRes.error) throw invRes.error;
            if (mechRes.error) throw mechRes.error;
            if (storeRes.error) throw storeRes.error;
            if (maintRes.error && maintRes.error.code !== '42P01') throw maintRes.error;
            if (recRes.error && recRes.error.code !== '42P01') throw recRes.error;
            if (notifRes.error && notifRes.error.code !== '42P01') throw notifRes.error;

            setVehicles(vehRes.data || []);
            setOwners(ownerRes.data || []);
            setInventory(invRes.data || []);
            setMechanics(mechRes.data || []);
            setStores(storeRes.data || []);
            setMaintenance(maintRes.data || []);
            setRecommendations(recRes.data || []);
            setNotifications(notifRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Vehicles (Vehiculos) ---
    const addVehicle = async (vehicle) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }

        // Check Plan Limits
        const plan = company?.plan || 'free';
        const currentCount = vehicles.length;

        if (plan === 'free' && currentCount >= 1) {
            return { error: { message: 'Plan Básico limitado a 1 vehículo. Actualiza tu plan.' } };
        }
        if (plan === 'standard' && currentCount >= 3) {
            return { error: { message: 'Plan Estándar limitado a 3 vehículos. Actualiza tu plan.' } };
        }

        const vehicleData = {
            ...vehicle,
            empresa_id: profile.empresa_id,
            // If usuario_id was used before, now we map it to propietario_id if it exists in the form
            propietario_id: vehicle.propietario_id || null,
            usuario_id: user.id // Add usuario_id to allow RLS visibility
        };

        const { data, error } = await supabase.from('vehiculos').insert([vehicleData]).select();
        if (error) {
            console.error('Error adding vehicle:', error.message);
            return { error };
        }
        setVehicles([data[0], ...vehicles]);
        return { data: data[0] };
    };

    const updateVehicle = async (id, updated) => {
        const { data, error } = await supabase.from('vehiculos').update(updated).eq('id', id).select();
        if (error) {
            console.error('Error updating vehicle:', error.message);
            return { error };
        }
        setVehicles(vehicles.map(v => v.id === id ? data[0] : v));
        return { data: data[0] };
    };

    const deleteVehicle = async (id) => {
        const { error } = await supabase.from('vehiculos').delete().eq('id', id);
        if (error) {
            console.error('Error deleting vehicle:', error.message);
            return { error };
        }
        setVehicles(vehicles.filter(v => v.id !== id));
        return { success: true };
    };

    // --- Clients (Propietarios) ---
    // --- Clients (Propietarios) ---
    const addClient = async (client) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }

        // --- CHECK LIMITS ---
        const plan = company?.plan || 'free';
        const dbLimit = company?.limit_clients; // Custom limit from DB
        let limit = Infinity;

        if (dbLimit !== undefined && dbLimit !== null) {
            limit = dbLimit === -1 ? Infinity : dbLimit;
        } else {
            // Default Plan Limits
            if (plan === 'free') limit = 1;
            else if (plan === 'standard') limit = 3;
            // Premium/Taller = Infinity
        }

        if (limit !== Infinity && owners.length >= limit) {
            const planName = plan === 'free' ? 'Básico' : 'Estándar';
            return { error: { message: `Tu Plan ${planName} está limitado a ${limit} clientes. Actualiza para agregar más.` } };
        }
        // ---------------------

        const { data, error } = await supabase.from('propietarios').insert([{ ...client, usuario_id: user.id, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding client:', error.message);
            return { error };
        }
        setOwners([data[0], ...owners]);
        return { data: data[0] };
    };

    // --- Inventory (Inventario) ---
    const addPart = async (part) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        const { data, error } = await supabase.from('inventario').insert([{ ...part, usuario_id: user.id, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding part:', error.message);
            return { error };
        }
        setInventory([data[0], ...inventory]);
        return { data: data[0] };
    };

    const updatePart = async (id, updated) => {
        const { data, error } = await supabase.from('inventario').update(updated).eq('id', id).select();
        if (error) {
            console.error('Error updating part:', error.message);
            return { error };
        }
        setInventory(inventory.map(i => i.id === id ? data[0] : i));
        return { data: data[0] };
    };

    const deletePart = async (id) => {
        const { error } = await supabase.from('inventario').delete().eq('id', id);
        if (error) {
            console.error('Error deleting part:', error.message);
            return { error };
        }
        setInventory(inventory.filter(i => i.id !== id));
        return { success: true };
    };

    // --- Mechanics (Mecanicos) ---
    const addMechanic = async (mechanic) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        const { data, error } = await supabase.from('mecanicos').insert([{ ...mechanic, usuario_id: user.id, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding mechanic:', error.message);
            return { error };
        }
        setMechanics([data[0], ...mechanics]);
        return { data: data[0] };
    };

    const updateMechanic = async (id, updated) => {
        const { data, error } = await supabase.from('mecanicos').update(updated).eq('id', id).select();
        if (error) {
            console.error('Error updating mechanic:', error.message);
            return { error };
        }
        setMechanics(mechanics.map(m => m.id === id ? data[0] : m));
        return { data: data[0] };
    };

    const deleteMechanic = async (id) => {
        const { error } = await supabase.from('mecanicos').delete().eq('id', id);
        if (error) {
            console.error('Error deleting mechanic:', error.message);
            return { error };
        }
        setMechanics(mechanics.filter(m => m.id !== id));
        return { success: true };
    };

    // --- Stores (Tiendas) ---
    const addStore = async (store) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        const { data, error } = await supabase.from('tiendas').insert([{ ...store, usuario_id: user.id, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding store:', error.message);
            return { error };
        }
        setStores([data[0], ...stores]);
        return { data: data[0] };
    };

    const updateStore = async (id, updated) => {
        const { data, error } = await supabase.from('tiendas').update(updated).eq('id', id).select();
        if (error) {
            console.error('Error updating store:', error.message);
            return { error };
        }
        setStores(stores.map(s => s.id === id ? data[0] : s));
        return { data: data[0] };
    };

    const deleteStore = async (id) => {
        const { error } = await supabase.from('tiendas').delete().eq('id', id);
        if (error) {
            console.error('Error deleting store:', error.message);
            return { error };
        }
        setStores(stores.filter(s => s.id !== id));
        return { success: true };
    };

    // --- Maintenance (Mantenimientos) ---
    const addMaintenance = async (maint, parts = []) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        // 0. Validate Stock (Server-side check)
        if (parts.length > 0) {
            for (const p of parts) {
                const { data: currentPart, error: fetchError } = await supabase
                    .from('inventario')
                    .select('cantidad, nombre')
                    .eq('id', p.id)
                    .single();

                if (fetchError) {
                    console.error('Error checking stock:', fetchError.message);
                    return { error: fetchError };
                }

                if (currentPart.cantidad < p.cantidad_usada) {
                    return {
                        error: {
                            message: `Stock insuficiente para ${currentPart.nombre}. Disponible: ${currentPart.cantidad}, Requerido: ${p.cantidad_usada}`
                        }
                    };
                }
            }
        }

        // 1. Insert Maintenance Record
        const { data: maintData, error: maintError } = await supabase
            .from('mantenimientos')
            .insert([{ ...maint, usuario_id: user.id, empresa_id: profile.empresa_id }])
            .select();

        if (maintError) {
            console.error('Error adding maintenance:', maintError.message);
            return { error: maintError };
        }

        const newMaint = maintData[0];

        // 2. Insert Maintenance Parts (if any)
        if (parts.length > 0) {
            const partsToInsert = parts.map(p => ({
                mantenimiento_id: newMaint.id,
                repuesto_id: p.id,
                cantidad: p.cantidad_usada,
                precio_unitario: p.precio
            }));

            const { error: partsError } = await supabase
                .from('mantenimiento_repuestos')
                .insert(partsToInsert);

            if (partsError) {
                console.error('Error adding maintenance parts:', partsError.message);
                // Note: We might want to rollback maintenance here, but Supabase JS doesn't support transactions easily without RPC.
            }

            // 3. Update Inventory Quantities
            for (const p of parts) {
                // Fetch fresh quantity again to be safe (though we just checked)
                const { data: currentPart } = await supabase
                    .from('inventario')
                    .select('cantidad')
                    .eq('id', p.id)
                    .single();

                if (currentPart) {
                    const newQuantity = currentPart.cantidad - p.cantidad_usada;
                    await supabase
                        .from('inventario')
                        .update({ cantidad: newQuantity })
                        .eq('id', p.id);
                }
            }
        }

        // Refresh data to get updates
        await fetchData();
        return { data: newMaint };
    };

    // --- AI Recommendations ---
    const addRecommendation = async (recommendation) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        const plan = company?.plan || 'free';
        if (plan === 'free') {
            return { error: { message: 'Tu plan actual no incluye IA. Actualiza a Estándar o Premium.' } };
        }

        const { data, error } = await supabase.from('recomendaciones_ia').insert([{ ...recommendation, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding recommendation:', error.message);
            return { error };
        }
        setRecommendations([data[0], ...recommendations]);
        return { data: data[0] };
    };

    // --- Notifications ---
    const markNotificationAsRead = async (id) => {
        const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
        if (error) {
            console.error('Error updating notification:', error.message);
            return;
        }
        setNotifications(notifications.map(n => n.id === id ? { ...n, leida: true } : n));
    };

    const markAllNotificationsAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.leida).map(n => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase.from('notificaciones').update({ leida: true }).in('id', unreadIds);
        if (error) {
            console.error('Error updating notifications:', error.message);
            return;
        }
        setNotifications(notifications.map(n => ({ ...n, leida: true })));
    };

    const addNotification = async (notification) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión: No se encontró la empresa asociada.' } };
        }
        const { data, error } = await supabase.from('notificaciones').insert([{ ...notification, usuario_id: user.id, empresa_id: profile.empresa_id }]).select();
        if (error) {
            console.error('Error adding notification:', error.message);
            return { error };
        }
        setNotifications([data[0], ...notifications]);
        return { data: data[0] };
    }

    const value = {
        company,
        vehicles, addVehicle, updateVehicle, deleteVehicle,
        owners, addClient, // Expose owners and addClient
        inventory, addPart, updatePart, deletePart,
        mechanics, addMechanic, updateMechanic, deleteMechanic,
        stores, addStore, updateStore, deleteStore,
        maintenance, addMaintenance,
        recommendations, addRecommendation,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
