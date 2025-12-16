import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { generateMaintenanceInsight } from '../services/aiService'; // Import AI service

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user, profile } = useAuth();
    // ... (existing state) ...
    const [vehicles, setVehicles] = useState([]);
    const [owners, setOwners] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [stores, setStores] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [events, setEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false); // New state to prevent double scans

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

            const [vehRes, ownerRes, invRes, mechRes, storeRes, maintRes, recRes, notifRes, documentsRes, eventsRes] = await Promise.all([
                supabase.from('vehiculos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('propietarios').select('*').eq('empresa_id', empresaId).order('nombre_completo', { ascending: true }),
                supabase.from('inventario').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('mecanicos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('tiendas').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('mantenimientos').select('*').eq('empresa_id', empresaId).order('fecha', { ascending: false }),
                supabase.from('recomendaciones_ia').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('notificaciones').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('documentos_vehiculo').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
                supabase.from('eventos_calendario').select('*').eq('empresa_id', empresaId).order('fecha', { ascending: true }),
            ]);

            if (vehRes.error) throw vehRes.error;
            if (ownerRes.error && ownerRes.error.code !== '42P01') console.warn('Error fetching owners:', ownerRes.error);

            // Document table might not exist yet, so handle gracefully
            const fetchedDocuments = (documentsRes.status === 404 || documentsRes.error?.code === '42P01') ? [] : documentsRes.data;
            const fetchedEvents = (eventsRes.status === 404 || eventsRes.error?.code === '42P01') ? [] : eventsRes.data;

            setVehicles(vehRes.data || []);
            setOwners(ownerRes.data || []);
            setInventory(invRes.data || []);
            setMechanics(mechRes.data || []);
            setStores(storeRes.data || []);
            setMaintenance(maintRes.data || []);
            setRecommendations(recRes.data || []);
            setNotifications(notifRes.data || []);
            setDocuments(fetchedDocuments || []);
            setEvents(fetchedEvents || []);
        } catch (error) {
            console.error('Error fetching data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- AUTOMATED SCAN LOGIC ---
    useEffect(() => {
        if (user && profile?.empresa_id) {
            fetchData();
        } else {
            // Reset state logic could go here if needed
        }
    }, [user, profile]);

    useEffect(() => {
        if (!loading && vehicles.length > 0 && profile?.empresa_id && !isScanning) {
            const lastScan = localStorage.getItem(`last_scan_${profile.empresa_id}`);
            const now = Date.now();
            // Run scan if never run or > 24 hours ago (scan frequently but analyze intelligently)
            if (!lastScan || (now - parseInt(lastScan)) > 86400000) {
                performAutoScan();
            }
        }
    }, [loading, vehicles, profile]);

    const performAutoScan = async () => {
        setIsScanning(true);
        console.log('🔄 Starting Automated Vehicle Scan...');
        let newNotificationsCount = 0;

        try {
            for (const vehicle of vehicles) {
                // 1. Check if vehicle has recent recommendation (< 7 days)
                const vehicleRecs = recommendations.filter(r => r.vehiculo_id === vehicle.id)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                const latestRec = vehicleRecs[0];
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                let insight = null;

                // Condition: No rec exists OR Main Rec is too old
                if (!latestRec || new Date(latestRec.created_at) < sevenDaysAgo) {
                    console.log(`Analyzing vehicle: ${vehicle.marca} ${vehicle.modelo}...`);
                    // Fetch history locally from state
                    const history = maintenance.filter(m => m.vehiculo_id === vehicle.id);

                    // Call AI
                    insight = await generateMaintenanceInsight(vehicle, history);

                    // Save new recommendation
                    if (insight) {
                        await addRecommendation({
                            vehiculo_id: vehicle.id,
                            contenido: JSON.stringify(insight),
                            tipo: 'mantenimiento'
                        });
                    }
                } else {
                    // Reuse existing insight
                    try {
                        insight = JSON.parse(latestRec.contenido);
                    } catch (e) {
                        console.warn('Error parsing existing rec', e);
                    }
                }

                // 2. Generate Notification if High Priority
                if (insight) {
                    const priority = insight.prioridad ? insight.prioridad.toLowerCase() : '';
                    if (['alta', 'high', 'urgente'].includes(priority)) {

                        // Check duplicate notification
                        const vehicleNotifs = notifications.filter(n =>
                            n.mensaje.includes(vehicle.placa) || n.titulo.includes(vehicle.modelo)
                        );

                        // Simple duplicate check: if any unread notification exists for this vehicle with "Alerta IA", skip
                        const hasActiveAlert = vehicleNotifs.some(n =>
                            !n.leida && n.titulo.includes('Alerta IA') && n.titulo.includes(insight.recomendacion.substring(0, 10))
                        );

                        if (!hasActiveAlert) {
                            await addNotification({
                                titulo: `Alerta IA: ${vehicle.marca} ${vehicle.modelo}`,
                                mensaje: `${insight.recomendacion}. (Prioridad: ${insight.prioridad}) - Placa: ${vehicle.placa}`,
                                tipo: 'alert',
                                leida: false
                            });
                            newNotificationsCount++;
                        }
                    }
                }
            }

            // Mark scan as done for today
            localStorage.setItem(`last_scan_${profile?.empresa_id}`, Date.now().toString());

            // --- 3. Check Document Expirations ---
            const docAlerts = await checkDocumentExpirations();
            newNotificationsCount += docAlerts;

            if (newNotificationsCount > 0) {
                console.log(`Scan complete. ${newNotificationsCount} new alerts.`);
            }
        } catch (error) {
            console.error('Auto Scan Error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const checkDocumentExpirations = async () => {
        let count = 0;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        for (const doc of documents) {
            if (doc.fecha_vencimiento) {
                const expiryDate = new Date(doc.fecha_vencimiento);
                const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                // Condition: Expiring soon (<= 30 days) AND not already processed today/recently
                // We use notifications as the "memory" of sent alerts to avoid duplicates
                if (daysUntil <= 30) {
                    const statusMsg = daysUntil < 0 ? 'VENCIDO' : `Vence en ${daysUntil} días`;
                    const urgency = daysUntil < 0 ? 'alert' : 'warning';

                    // Duplicate Check
                    const docNotifs = notifications.filter(n =>
                        n.titulo.includes('Vencimiento Documento') &&
                        n.mensaje.includes(doc.titulo) &&
                        !n.leida
                    );

                    if (docNotifs.length === 0) {
                        const vehicle = vehicles.find(v => v.id === doc.vehiculo_id);
                        const vehicleName = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Vehículo';

                        await addNotification({
                            titulo: `⚠️ Vencimiento Documento: ${doc.tipo}`,
                            mensaje: `${statusMsg}: "${doc.titulo}" (${vehicleName}). Renovar ASAP.`,
                            tipo: urgency,
                            leida: false
                        });
                        count++;
                    }
                }
            }
        }
        return count;
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

    const addFuelRecord = async (data) => {
        // Wrapper around addMaintenance for Fuel
        // data: { vehiculo_id, fecha, litros, costo_total, kilometraje }

        const maintenanceRecord = {
            vehiculo_id: data.vehiculo_id,
            tipo: 'Combustible', // Special type
            fecha: data.fecha,
            costo_mano_obra: data.costo_total, // Store total cost here
            kilometraje: data.kilometraje,
            descripcion: 'Carga de Combustible',
            notas: JSON.stringify({ litros: data.litros, precio_galon: (data.costo_total / data.litros).toFixed(2) }) // Store metadata in notes
        };

        return await addMaintenance(maintenanceRecord, []);
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

    const deleteRecommendation = async (id) => {
        const { error } = await supabase.from('recomendaciones_ia').delete().eq('id', id);
        if (error) {
            console.error('Error deleting recommendation:', error.message);
            return { error };
        }
        setRecommendations(recommendations.filter(r => r.id !== id));
        return { success: true };
    };



    // --- Documents (Documentos) ---
    const addDocument = async (docData, file) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión' } };
        }

        let fileUrl = null;

        // 1. Upload File (if present)
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${docData.vehiculo_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                return { error: { message: 'Error al subir archivo. Verifica que exista el bucket "documentos".' } };
            }

            const { data: publicUrlData } = supabase.storage
                .from('documentos')
                .getPublicUrl(filePath);

            fileUrl = publicUrlData.publicUrl;
        }

        // 2. Insert Record
        const { data, error } = await supabase
            .from('documentos_vehiculo')
            .insert([{
                ...docData,
                url_archivo: fileUrl,
                empresa_id: profile.empresa_id
            }])
            .select();

        if (error) {
            console.error('Error adding document:', error.message);
            return { error };
        }

        setDocuments([data[0], ...documents]);
        return { data: data[0] };
    };

    const deleteDocument = async (id, urlArchivo) => {
        // 1. Delete File from Storage (if exists)
        if (urlArchivo) {
            try {
                const path = urlArchivo.split('/documentos/')[1]; // Extract path from URL
                if (path) {
                    await supabase.storage.from('documentos').remove([path]);
                }
            } catch (e) {
                console.warn('Error cleanup storage:', e);
            }
        }

        // 2. Delete Record
        const { error } = await supabase.from('documentos_vehiculo').delete().eq('id', id);

        if (error) {
            console.error('Error deleting document:', error);
            return { error };
        }

        setDocuments(documents.filter(d => d.id !== id));
        return { success: true };
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

    // --- Events (Eventos Calendario) ---
    const addEvent = async (eventData) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión' } };
        }

        const { data, error } = await supabase
            .from('eventos_calendario')
            .insert([{
                ...eventData,
                empresa_id: profile.empresa_id
            }])
            .select();

        if (error) {
            console.error('Error adding event:', error.message);
            return { error };
        }
        setEvents([data[0], ...events]);
        return { data: data[0] };
    };

    const deleteEvent = async (id) => {
        const { error } = await supabase.from('eventos_calendario').delete().eq('id', id);
        if (error) {
            console.error('Error deleting event:', error);
            return { error };
        }
        setEvents(events.filter(e => e.id !== id));
        return { success: true };
    };

    const value = {
        company,
        performAutoScan,
        vehicles, addVehicle, updateVehicle, deleteVehicle,
        owners, addClient, // Expose owners and addClient
        inventory, addPart, updatePart, deletePart,
        mechanics, addMechanic, updateMechanic, deleteMechanic,
        stores, addStore, updateStore, deleteStore,
        maintenance, addMaintenance, addFuelRecord,
        recommendations, addRecommendation, deleteRecommendation,
        documents, addDocument, deleteDocument,
        events, addEvent, deleteEvent, // Expose events
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
