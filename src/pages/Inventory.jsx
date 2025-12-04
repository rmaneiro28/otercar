import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Package, Edit2, Trash2, Search, AlertTriangle, Car } from 'lucide-react';
import Modal from '../components/UI/Modal';
import InventoryForm from '../components/Forms/InventoryForm';
import { toast } from 'sonner';

const VehicleNameLookup = ({ vehicleId }) => {
    const { vehicles } = useData();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return <span>Vehículo desconocido</span>;
    return <span>{vehicle.marca} {vehicle.modelo}</span>;
};

const Inventory = () => {
    const { inventory, addPart, updatePart, deletePart } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const categories = [
        "Motor", "Transmisión", "Frenos", "Suspensión y Dirección", "Sistema Eléctrico",
        "Carrocería", "Interior", "Climatización", "Fluidos y Químicos", "Neumáticos y Ruedas",
        "Escape y Emisiones", "Filtros", "Iluminación", "Accesorios", "Herramientas", "Otros"
    ];

    const handleAdd = () => {
        setEditingPart(null);
        setIsModalOpen(true);
    };

    const handleEdit = (part) => {
        setEditingPart(part);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este repuesto?')) {
            const result = await deletePart(id);
            if (result && result.error) {
                toast.error('Error al eliminar repuesto');
            } else {
                toast.success('Repuesto eliminado correctamente');
            }
        }
    };

    const handleSubmit = async (data) => {
        let result;
        if (editingPart) {
            result = await updatePart(editingPart.id, data);
            if (result && result.error) {
                toast.error('Error al actualizar repuesto');
            } else {
                toast.success('Repuesto actualizado correctamente');
                setIsModalOpen(false);
            }
        } else {
            result = await addPart(data);
            if (result && result.error) {
                toast.error('Error al agregar repuesto');
            } else {
                toast.success('Repuesto agregado correctamente');
                setIsModalOpen(false);
            }
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.numero_parte && item.numero_parte.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.categoria && item.categoria.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = categoryFilter === '' || item.categoria === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventario</h1>
                    <p className="text-slate-500 dark:text-slate-400">Control de repuestos y stock.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Repuesto</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, número de parte..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-800 dark:text-white"
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {inventory.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Inventario vacío</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Agrega repuestos para llevar el control.</p>
                    <button
                        onClick={handleAdd}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 hover:underline"
                    >
                        Agregar Repuesto
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInventory.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group relative overflow-hidden">
                            {item.cantidad < 5 && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    BAJO STOCK
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{item.nombre}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{item.numero_parte || 'S/N'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">CANTIDAD</p>
                                    <p className={`text-lg font-bold ${item.cantidad < 5 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                        {item.cantidad}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">PRECIO</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">${item.precio}</p>
                                </div>
                            </div>

                            {item.categoria && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                                        {item.categoria}
                                    </span>
                                    {item.vehiculo_id && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                            <Car className="w-3 h-3" />
                                            <VehicleNameLookup vehicleId={item.vehiculo_id} />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPart ? 'Editar Repuesto' : 'Nuevo Repuesto'}
            >
                <InventoryForm
                    onSubmit={handleSubmit}
                    initialData={editingPart}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Inventory;
