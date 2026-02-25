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
        const userEmail = user?.email;
        const userId = user?.id;

        if (!userEmail || !userId) return;

        try {
            // 1. Fetch company details (try by empresaId, then by owner_id)
            if (empresaId) {
                const { data: companyData } = await supabase.from('empresas').select('*').eq('id', empresaId).maybeSingle();
                if (companyData) setCompany(companyData);
            } else if (userId) {
                // Fallback: search by owner_id if not linked in profile
                const { data: ownerCompany } = await supabase.from('empresas').select('*').eq('owner_id', userId).maybeSingle();
                if (ownerCompany) setCompany(ownerCompany);
            }

            // --- AUTO-LINKING LOGIC ---
            // 1. Get all IDs in 'propietarios' that belong to me (by ID or Email)
            const { data: myOwnerRecords } = await supabase
                .from('propietarios')
                .select('id, usuario_id')
                .or(`usuario_id.eq.${userId},email.eq.${userEmail}`);

            const allMyOwnerIds = (myOwnerRecords?.map(o => o.id) || []);

            // 2. Link them to my account if they aren't already
            const unlinkedOwners = myOwnerRecords?.filter(o => !o.usuario_id) || [];
            if (unlinkedOwners.length > 0) {
                await supabase.from('propietarios').update({ usuario_id: userId }).in('id', unlinkedOwners.map(o => o.id));
            }

            // 3. Fetch Vehicles
            let vehicleQuery = supabase.from('vehiculos').select('*');

            let queryParts = [`usuario_id.eq.${userId}`];
            if (allMyOwnerIds.length > 0) {
                queryParts.push(`propietario_id.in.(${allMyOwnerIds.join(',')})`);
            }
            if (empresaId) {
                queryParts.push(`empresa_id.eq.${empresaId}`);
            }

            const { data: fetchedVehicles, error: vehError } = await vehicleQuery
                .or(queryParts.join(','))
                .order('created_at', { ascending: false });

            if (vehError) throw vehError;
            setVehicles(fetchedVehicles || []);

            const myVehicleIds = (fetchedVehicles?.map(v => v.id) || []);

            // 4. Fetch dependent data
            const vehicleFilter = (query) => {
                if (myVehicleIds.length > 0) {
                    let filter = `vehiculo_id.in.(${myVehicleIds.join(',')})`;
                    if (empresaId) filter += `,empresa_id.eq.${empresaId}`;
                    return query.or(filter);
                }
                return empresaId ? query.eq('empresa_id', empresaId) : query.eq('id', '00000000-0000-0000-0000-000000000000');
            };

            const companyFilter = (query) => {
                // If I'm a workshop, I filter by my company.
                // If I'm a personal user, I filter by my userId to see my private records (mechanics, inventory, etc.)
                if (empresaId) {
                    return query.eq('empresa_id', empresaId);
                }
                return query.eq('usuario_id', userId);
            };
            // Perform all fetches independently. If one fails, it shouldn't stop others.
            const safeFetch = async (name, query) => {
                try {
                    const { data, error } = await query;
                    if (error) {
                        console.warn(`[DataContext] Error loading ${name}:`, error.message);
                        return [];
                    }
                    return data || [];
                } catch (e) {
                    console.error(`[DataContext] Critical Fetch Error for ${name}:`, e);
                    return [];
                }
            };

            const [
                fetchedOwners,
                fetchedInventory,
                fetchedMechanics,
                fetchedStores,
                fetchedMaintenance,
                fetchedRecommendations,
                fetchedNotifications,
                fetchedDocuments,
                fetchedEvents
            ] = await Promise.all([
                safeFetch('owners', companyFilter(supabase.from('propietarios').select('*').order('nombre_completo', { ascending: true }))),
                safeFetch('inventory', companyFilter(supabase.from('inventario').select('*').order('created_at', { ascending: false }))),
                safeFetch('mechanics', companyFilter(supabase.from('mecanicos').select('*').order('created_at', { ascending: false }))),
                safeFetch('stores', companyFilter(supabase.from('tiendas').select('*').order('created_at', { ascending: false }))),
                safeFetch('maintenance', vehicleFilter(supabase.from('mantenimientos').select('*, mantenimiento_repuestos(*, inventario(nombre))')).order('fecha', { ascending: false })),
                safeFetch('recommendations', vehicleFilter(supabase.from('recomendaciones_ia').select('*')).order('created_at', { ascending: false })),
                safeFetch('notifications', companyFilter(supabase.from('notificaciones').select('*').order('created_at', { ascending: false }))),
                safeFetch('documents', vehicleFilter(supabase.from('documentos_vehiculo').select('*')).order('created_at', { ascending: false })),
                safeFetch('events', companyFilter(supabase.from('eventos_calendario').select('*').order('fecha', { ascending: true })))
            ]);

            setOwners(fetchedOwners);
            setInventory(fetchedInventory);
            setMechanics(fetchedMechanics);
            setStores(fetchedStores);
            setMaintenance(fetchedMaintenance);
            setRecommendations(fetchedRecommendations);
            setNotifications(fetchedNotifications);
            setDocuments(fetchedDocuments);
            setEvents(fetchedEvents);

        } catch (error) {
            console.error('DataContext: Global Fetch Failure', error);
        } finally {
            setLoading(false);
        }
    };

    // --- AUTOMATED SCAN LOGIC ---
    useEffect(() => {
        // CORRECCIÓN: Llamar a fetchData si hay un usuario logueado, sin importar si tiene empresa_id
        if (user) {
            fetchData();
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }

        const empresaId = profile?.empresa_id;

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
            empresa_id: empresaId || null,
            propietario_id: vehicle.propietario_id || null,
            usuario_id: user.id
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }
        const empresaId = profile?.empresa_id;

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

        const { data, error } = await supabase.from('propietarios').insert([{ ...client, usuario_id: user.id, empresa_id: empresaId || null }]).select();
        if (error) {
            console.error('Error adding client:', error.message);
            return { error };
        }
        setOwners([data[0], ...owners]);
        return { data: data[0] };
    };

    // --- Inventory (Inventario) ---
    const addPart = async (part) => {
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }
        const empresaId = profile?.empresa_id;
        const { data, error } = await supabase.from('inventario').insert([{ ...part, usuario_id: user.id, empresa_id: empresaId || null }]).select();
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }
        const empresaId = profile?.empresa_id;
        const { data, error } = await supabase.from('mecanicos').insert([{ ...mechanic, usuario_id: user.id, empresa_id: empresaId || null }]).select();
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }
        const empresaId = profile?.empresa_id;
        const { data, error } = await supabase.from('tiendas').insert([{ ...store, usuario_id: user.id, empresa_id: empresaId || null }]).select();
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }

        try {
            // 0. Validate Stock (Server-side check)
            if (parts.length > 0) {
                for (const p of parts) {
                    const { data: currentPart, error: fetchError } = await supabase
                        .from('inventario')
                        .select('cantidad, nombre')
                        .eq('id', p.id)
                        .single();

                    if (fetchError) {
                        console.error('Error al verificar stock:', fetchError);
                        throw new Error(`No se pudo verificar el stock de ${p.nombre}`);
                    }

                    if (!currentPart || currentPart.cantidad < p.cantidad_usada) {
                        throw new Error(`Stock insuficiente para ${currentPart?.nombre || 'el repuesto'}. Disponible: ${currentPart?.cantidad || 0}, Requerido: ${p.cantidad_usada}`);
                    }
                }
            }

            // 1. Insert Maintenance Record
            const maintenanceToInsert = {
                ...maint,
                usuario_id: user.id,
                empresa_id: profile?.empresa_id || null,
                mecanico_id: (maint.mecanico_id && maint.mecanico_id.trim() !== '') ? maint.mecanico_id : null,
                vehiculo_id: (maint.vehiculo_id && maint.vehiculo_id.trim() !== '') ? maint.vehiculo_id : null
            };

            const { data: maintData, error: maintError } = await supabase
                .from('mantenimientos')
                .insert([maintenanceToInsert])
                .select();

            if (maintError) {
                console.error('Error al insertar mantenimiento:', maintError.message);
                throw maintError;
            }

            if (!maintData || maintData.length === 0) {
                throw new Error('No se pudo crear el registro de mantenimiento.');
            }

            const newMaint = maintData[0];

            // 2. Insert Maintenance Parts (if any)
            if (parts.length > 0 && newMaint) {
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
                    console.warn('Error al guardar repuestos (el mantenimiento se guardó):', partsError);
                }

                // 3. Update Inventory Quantities
                for (const p of parts) {
                    const { data: cp } = await supabase
                        .from('inventario')
                        .select('cantidad')
                        .eq('id', p.id)
                        .single();

                    if (cp) {
                        const newQuantity = cp.cantidad - p.cantidad_usada;
                        await supabase
                            .from('inventario')
                            .update({ cantidad: newQuantity })
                            .eq('id', p.id);
                    }
                }
            }

            // Refresh local state
            await fetchData();
            return { data: newMaint };

        } catch (error) {
            console.error('Error crítico en addMaintenance:', error);
            return { error: { message: error.message || 'Error desconocido al registrar mantenimiento' } };
        }
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

    const updateMaintenance = async (id, updatedMaint, parts = []) => {
        if (!id) return { error: { message: 'ID de mantenimiento requerido para actualizar.' } };

        console.log(`[DataContext] Iniciando actualización de mantenimiento ID: ${id}`, { updatedMaint, partsCount: parts.length });

        try {
            // 0. DIAGNOSTIC: Check if the record even exists and who owns it
            const { data: existing, error: checkError } = await supabase
                .from('mantenimientos')
                .select('id, usuario_id, empresa_id, vehiculo_id')
                .eq('id', id)
                .single();

            if (checkError || !existing) {
                console.error('[DataContext] DIAGNÓSTICO: Registro no encontrado o invisible.', checkError);
                throw new Error('No se puede encontrar el registro a editar. Es posible que no tengas permisos de acceso.');
            }

            console.log('[DataContext] DIAGNÓSTICO: Registro encontrado.', {
                auth_user: user?.id,
                auth_empresa: profile?.empresa_id,
                record_user: existing.usuario_id,
                record_empresa: existing.empresa_id,
                record_vehiculo: existing.vehiculo_id
            });

            // 1. Rollback stock of old parts
            const { data: oldParts, error: fetchOldPartsError } = await supabase
                .from('mantenimiento_repuestos')
                .select('*')
                .eq('mantenimiento_id', id);

            if (fetchOldPartsError) throw fetchOldPartsError;

            if (oldParts && oldParts.length > 0) {
                console.log(`[DataContext] Reversando stock de ${oldParts.length} repuestos antiguos...`);
                for (const op of oldParts) {
                    const { data: cp } = await supabase
                        .from('inventario')
                        .select('cantidad')
                        .eq('id', op.repuesto_id)
                        .single();
                    if (cp) {
                        await supabase
                            .from('inventario')
                            .update({ cantidad: cp.cantidad + op.cantidad })
                            .eq('id', op.repuesto_id);
                    }
                }
            }

            // 2. Delete old part links
            const { error: deletePartsError } = await supabase
                .from('mantenimiento_repuestos')
                .delete()
                .eq('mantenimiento_id', id);

            if (deletePartsError) throw deletePartsError;

            // 3. Update main record (UPSERT for better RLS handling)
            const maintenanceToUpdate = {
                id: id,
                usuario_id: user.id,
                empresa_id: profile?.empresa_id || null,
                vehiculo_id: updatedMaint.vehiculo_id || null,
                mecanico_id: updatedMaint.mecanico_id || null,
                tipo: updatedMaint.tipo,
                descripcion: updatedMaint.descripcion,
                fecha: updatedMaint.fecha,
                kilometraje: updatedMaint.kilometraje === '' ? 0 : Number(updatedMaint.kilometraje),
                costo_mano_obra: updatedMaint.costo_mano_obra === '' ? 0 : Number(updatedMaint.costo_mano_obra),
                costo_total: updatedMaint.costo_total || 0,
                notas: updatedMaint.notas || ''
            };

            const { data: updatedData, error: updateError } = await supabase
                .from('mantenimientos')
                .upsert(maintenanceToUpdate)
                .select();

            if (updateError) throw updateError;

            if (!updatedData || updatedData.length === 0) {
                // Si llegamos aquí, es que el UPDATE/UPSERT fue bloqueado por RLS.
                throw new Error('Supabase denegó el guardado. Falta la política RLS de UPDATE para cuentas personales.');
            }

            console.log('[DataContext] Registro principal actualizado exitosamente.');

            // 4. Insert new part links
            if (parts.length > 0) {
                console.log(`[DataContext] Registrando ${parts.length} nuevos repuestos...`);
                const partsToInsert = parts.map(p => ({
                    mantenimiento_id: id,
                    repuesto_id: p.id,
                    cantidad: p.cantidad_usada,
                    precio_unitario: p.precio
                }));

                const { error: insertPartsError } = await supabase
                    .from('mantenimiento_repuestos')
                    .insert(partsToInsert);

                if (insertPartsError) throw insertPartsError;

                // 5. Deduct stock for new parts
                for (const p of parts) {
                    const { data: cp } = await supabase
                        .from('inventario')
                        .select('cantidad')
                        .eq('id', p.id)
                        .single();
                    if (cp) {
                        const newQty = cp.cantidad - p.cantidad_usada;
                        if (newQty < 0) console.warn(`[DataContext] Advertencia: Stock negativo para repuesto ${p.id}`);
                        await supabase
                            .from('inventario')
                            .update({ cantidad: newQty })
                            .eq('id', p.id);
                    }
                }
            }

            console.log('[DataContext] Actualización completa. Refrescando datos...');
            // Refresh local state
            await fetchData();
            return { data: updatedData[0] };
        } catch (error) {
            console.error('[DataContext] Error crítico actualizando mantenimiento:', error);
            return { error: { message: error.message || 'Error desconocido al actualizar' } };
        }
    };

    // --- AI Recommendations ---
    const addRecommendation = async (recommendation) => {
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }

        const plan = (company?.plan || 'free').toLowerCase();
        if (plan === 'free') {
            return { error: { message: 'Tu plan actual no incluye IA. Actualiza a Estándar o Premium.' } };
        }

        const { data, error } = await supabase.from('recomendaciones_ia').insert([{ ...recommendation, empresa_id: profile?.empresa_id || null, usuario_id: user.id }]).select();
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
    const compressImage = async (file) => {
        // Only compress images
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimension (e.g., 1200px)
                    const MAX_SIZE = 1200;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
        });
    };

    const addDocument = async (docData, file) => {
        if (!profile?.empresa_id) {
            return { error: { message: 'Error de sesión' } };
        }

        let fileUrl = null;

        // 1. Upload File (if present)
        if (file) {
            try {
                // COMPRESSION BEFORE UPLOAD
                const fileToUpload = file.type.startsWith('image/') ? await compressImage(file) : file;

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${docData.vehiculo_id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documentos')
                    .upload(filePath, fileToUpload);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('documentos')
                    .getPublicUrl(filePath);

                fileUrl = publicUrlData.publicUrl;
            } catch (error) {
                console.error('Error handling file:', error);
                return { error: { message: 'Error al procesar/subir archivo. Verifica el bucket "documentos".' } };
            }
        }

        // 2. Insert Record
        const { data, error } = await supabase
            .from('documentos_vehiculo')
            .insert([{
                ...docData,
                url_archivo: fileUrl,
                empresa_id: profile?.empresa_id || null,
                usuario_id: user.id
            }])
            .select();

        if (error) {
            console.error('Error adding document:', error.message);
            return { error };
        }

        setDocuments([data[0], ...documents]);
        return { data: data[0] };
    };

    const updateDocument = async (id, updatedData, file) => {
        let fileUrl = updatedData.url_archivo;

        // 1. Handle New File Upload (if present)
        if (file) {
            try {
                // COMPRESSION BEFORE UPLOAD
                const fileToUpload = file.type.startsWith('image/') ? await compressImage(file) : file;

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${updatedData.vehiculo_id}/${fileName}`;

                // Upload new file
                const { error: uploadError } = await supabase.storage
                    .from('documentos')
                    .upload(filePath, fileToUpload);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('documentos')
                    .getPublicUrl(filePath);

                fileUrl = publicUrlData.publicUrl;

                // Cleanup old file if it existed
                if (updatedData.url_archivo) {
                    const oldPath = updatedData.url_archivo.split('/documentos/')[1];
                    if (oldPath) await supabase.storage.from('documentos').remove([oldPath]);
                }
            } catch (error) {
                console.error('Error handling file update:', error);
                return { error: { message: 'Error al actualizar archivo.' } };
            }
        }

        // 2. Update Record
        const { data, error } = await supabase
            .from('documentos_vehiculo')
            .update({
                ...updatedData,
                url_archivo: fileUrl
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating document:', error.message);
            return { error };
        }

        setDocuments(documents.map(d => d.id === id ? data[0] : d));
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
        if (!user) {
            return { error: { message: 'Error de sesión: Usuario no autenticado.' } };
        }
        const { data, error } = await supabase.from('notificaciones').insert([{ ...notification, usuario_id: user.id, empresa_id: profile?.empresa_id || null }]).select();
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
                empresa_id: profile?.empresa_id || null,
                usuario_id: user.id
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
        maintenance, addMaintenance, updateMaintenance, addFuelRecord,
        recommendations, addRecommendation, deleteRecommendation,
        documents, addDocument, updateDocument, deleteDocument,
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
