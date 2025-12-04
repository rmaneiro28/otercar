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
