import * as XLSX from 'xlsx';

// Define headers for each sheet
const TEMPLATE_STRUCTURE = {
    Clientes: [
        'nombre_completo',
        'email',
        'telefono',
        'direccion'
    ],
    Vehiculos: [
        'marca',
        'modelo',
        'placa',
        'anio',
        'color',
        'kilometraje',
        'vin',
        'propietario_email' // Key to link with Clients
    ],
    Inventario: [
        'nombre',
        'marca',
        'modelo',
        'cantidad',
        'precio',
        'ubicacion',
        'codigo_referencia',
        'min_stock'
    ],
    Mecanicos: [
        'nombre',
        'especialidad',
        'telefono',
        'email'
    ],
    Tiendas: [
        'nombre',
        'telefono',
        'direccion',
        'sitio_web',
        'notas'
    ]
};

// Sample data for the template (optional, helps users understand format)
const SAMPLE_DATA = {
    Clientes: [
        { nombre_completo: 'Juan Pérez', email: 'juan@ejemplo.com', telefono: '+584121234567', direccion: 'Calle 1, Ciudad' }
    ],
    Vehiculos: [
        { marca: 'Toyota', modelo: 'Corolla', placa: 'ABC1234', anio: 2020, color: 'Blanco', kilometraje: 50000, vin: '123456789', propietario_email: 'juan@ejemplo.com' }
    ],
    Inventario: [
        { nombre: 'Filtro de Aceite', marca: 'Bosch', modelo: 'X123', cantidad: 10, precio: 15.50, ubicacion: 'Estante A1', codigo_referencia: 'FIL-001', min_stock: 5 }
    ],
    Mecanicos: [
        { nombre: 'Carlos Ruiz', especialidad: 'Frenos', telefono: '+584149876543', email: 'carlos@taller.com' }
    ],
    Tiendas: [
        { nombre: 'Repuestos El Rápido', telefono: '+582125555555', direccion: 'Av. Principal', sitio_web: 'www.elrapido.com', notas: 'Buenos precios en aceites' }
    ]
};

export const generateTemplate = () => {
    const wb = XLSX.utils.book_new();

    Object.keys(TEMPLATE_STRUCTURE).forEach(sheetName => {
        const headers = TEMPLATE_STRUCTURE[sheetName];
        const sample = SAMPLE_DATA[sheetName];

        // Create worksheet with headers and sample data
        const ws = XLSX.utils.json_to_sheet(sample, { header: headers });

        // Set column widths for better readability
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Write file
    XLSX.writeFile(wb, 'Plantilla_OterCar.xlsx');
};

export const parseImportFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const result = {};

                Object.keys(TEMPLATE_STRUCTURE).forEach(sheetName => {
                    if (wb.SheetNames.includes(sheetName)) {
                        const ws = wb.Sheets[sheetName];
                        // Convert to JSON, treating all fields as text initially to avoid parsing issues
                        result[sheetName] = XLSX.utils.sheet_to_json(ws, { defval: null });
                    } else {
                        result[sheetName] = [];
                    }
                });

                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const processImport = async (data, contextFunctions) => {
    const { addClient, addVehicle, addPart, addMechanic, addStore } = contextFunctions;
    const errors = [];
    const results = {
        clients: 0,
        vehicles: 0,
        inventory: 0,
        mechanics: 0,
        stores: 0
    };

    // 1. Process Clients (Propietarios) first to establish IDs
    const clientMap = new Map(); // email -> id

    if (data.Clientes && data.Clientes.length > 0) {
        for (const client of data.Clientes) {
            if (!client.nombre_completo) {
                errors.push(`Cliente sin nombre: ${JSON.stringify(client)}`);
                continue;
            }
            // Try to add client
            const res = await addClient(client);
            if (res.error) {
                errors.push(`Error al importar cliente ${client.nombre_completo}: ${res.error.message}`);
            } else if (res.data) {
                results.clients++;
                if (client.email) {
                    clientMap.set(client.email, res.data.id);
                }
            }
        }
    }

    // 2. Process Vehicles (Link to Clients)
    if (data.Vehiculos && data.Vehiculos.length > 0) {
        for (const vehicle of data.Vehiculos) {
            if (!vehicle.placa) {
                errors.push(`Vehículo sin placa: ${JSON.stringify(vehicle)}`);
                continue;
            }

            // Resolve Owner ID
            let ownerId = null;
            if (vehicle.propietario_email) {
                ownerId = clientMap.get(vehicle.propietario_email);
                if (!ownerId) {
                    errors.push(`Advertencia: No se encontró propietario con email ${vehicle.propietario_email} para el vehículo ${vehicle.placa}. Se creará sin asignar.`);
                }
            }

            const vehicleData = {
                ...vehicle,
                propietario_id: ownerId
            };
            delete vehicleData.propietario_email; // Remove temp field

            const res = await addVehicle(vehicleData);
            if (res.error) {
                errors.push(`Error al importar vehículo ${vehicle.placa}: ${res.error.message}`);
            } else {
                results.vehicles++;
            }
        }
    }

    // 3. Process Inventory
    if (data.Inventario && data.Inventario.length > 0) {
        for (const item of data.Inventario) {
            if (!item.nombre || !item.cantidad || !item.precio) {
                errors.push(`Item de inventario incompleto: ${JSON.stringify(item)}`);
                continue;
            }
            const res = await addPart(item);
            if (res.error) {
                errors.push(`Error al importar item ${item.nombre}: ${res.error.message}`);
            } else {
                results.inventory++;
            }
        }
    }

    // 4. Process Mechanics
    if (data.Mecanicos && data.Mecanicos.length > 0) {
        for (const mech of data.Mecanicos) {
            if (!mech.nombre) {
                errors.push(`Mecánico sin nombre: ${JSON.stringify(mech)}`);
                continue;
            }
            const res = await addMechanic(mech);
            if (res.error) {
                errors.push(`Error al importar mecánico ${mech.nombre}: ${res.error.message}`);
            } else {
                results.mechanics++;
            }
        }
    }

    // 5. Process Stores
    if (data.Tiendas && data.Tiendas.length > 0) {
        for (const store of data.Tiendas) {
            if (!store.nombre) {
                errors.push(`Tienda sin nombre: ${JSON.stringify(store)}`);
                continue;
            }
            const res = await addStore(store);
            if (res.error) {
                errors.push(`Error al importar tienda ${store.nombre}: ${res.error.message}`);
            } else {
                results.stores++;
            }
        }
    }

    return { results, errors };
};

export const exportDatabase = ({ owners, vehicles, inventory, mechanics, stores }) => {
    const wb = XLSX.utils.book_new();

    // 1. Clients (Propietarios)
    // Transform data to ensure it matches the template and cleans up Supabase fields
    const clientsData = owners.map(client => ({
        nombre_completo: client.nombre_completo,
        email: client.email,
        telefono: client.telefono,
        direccion: client.direccion,
        // Optional: Keep ID if we want to re-import smartly later, but template doesn't specify it.
        // For backup purposes, maybe good to keep hidden or implicit.
        // Let's stick to the visible text format for now as requested "campos actualizados"
    }));
    const wsClients = XLSX.utils.json_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');

    // 2. Vehicles
    // Need to map owner_id back to email for meaningful export?
    // Or just export as is. The user asked "manteniendo los datos".
    // If I export owner_id, it's useless for manual reading.
    // Let's try to map owner_id to email if possible.
    // But wait, the input 'vehicles' comes from DataContext which usually has raw data.
    // 'owners' is also passed. I can create a map.
    const ownerMap = new Map(owners.map(o => [o.id, o.email]));

    const vehiclesData = vehicles.map(v => ({
        marca: v.marca,
        modelo: v.modelo,
        placa: v.placa,
        anio: v.anio,
        color: v.color,
        kilometraje: v.kilometraje,
        vin: v.vin,
        propietario_email: ownerMap.get(v.propietario_id) || 'N/A'
    }));
    const wsVehicles = XLSX.utils.json_to_sheet(vehiclesData);
    XLSX.utils.book_append_sheet(wb, wsVehicles, 'Vehiculos');

    // 3. Inventory
    const inventoryData = inventory.map(i => ({
        nombre: i.nombre,
        marca: i.marca,
        modelo: i.modelo,
        cantidad: i.cantidad,
        precio: i.precio,
        ubicacion: i.ubicacion,
        codigo_referencia: i.codigo_referencia,
        min_stock: i.min_stock
    }));
    const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario');

    // 4. Mechanics
    const mechanicsData = mechanics.map(m => ({
        nombre: m.nombre,
        especialidad: m.especialidad,
        telefono: m.telefono,
        email: m.email
    }));
    const wsMechanics = XLSX.utils.json_to_sheet(mechanicsData);
    XLSX.utils.book_append_sheet(wb, wsMechanics, 'Mecanicos');

    // 5. Stores
    const storesData = stores.map(s => ({
        nombre: s.nombre,
        telefono: s.telefono,
        direccion: s.direccion,
        sitio_web: s.sitio_web,
        notas: s.notas
    }));
    const wsStores = XLSX.utils.json_to_sheet(storesData);
    XLSX.utils.book_append_sheet(wb, wsStores, 'Tiendas');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `OterCar_Backup_${date}.xlsx`);
};
