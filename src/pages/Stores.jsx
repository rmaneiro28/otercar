import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, ShoppingBag, Edit2, Trash2, Search, Phone, MapPin, Globe } from 'lucide-react';
import Modal from '../components/UI/Modal';
import StoreForm from '../components/Forms/StoreForm';
import { toast } from 'sonner';

const Stores = () => {
    const { stores, addStore, updateStore, deleteStore } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = () => {
        setEditingStore(null);
        setIsModalOpen(true);
    };

    const handleEdit = (store) => {
        setEditingStore(store);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta tienda?')) {
            const result = await deleteStore(id);
            if (result && result.error) {
                toast.error('Error al eliminar tienda');
            } else {
                toast.success('Tienda eliminada correctamente');
            }
        }
    };

    const handleSubmit = async (data) => {
        let result;
        if (editingStore) {
            result = await updateStore(editingStore.id, data);
            if (result && result.error) {
                toast.error('Error al actualizar tienda');
            } else {
                toast.success('Tienda actualizada correctamente');
                setIsModalOpen(false);
            }
        } else {
            result = await addStore(data);
            if (result && result.error) {
                toast.error('Error al agregar tienda');
            } else {
                toast.success('Tienda agregada correctamente');
                setIsModalOpen(false);
            }
        }
    };

    const filteredStores = stores.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tiendas</h1>
                    <p className="text-slate-500">Proveedores y tiendas de repuestos.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Tienda</span>
                </button>
            </div>

            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            {stores.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No hay tiendas registradas</h3>
                    <p className="text-slate-500 mb-6">Agrega tus proveedores favoritos.</p>
                    <button
                        onClick={handleAdd}
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                    >
                        Agregar Tienda
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStores.map((store) => (
                        <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-lg">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{store.nombre}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(store)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(store.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                {store.telefono && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{store.telefono}</span>
                                    </div>
                                )}
                                {store.direccion && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{store.direccion}</span>
                                    </div>
                                )}
                                {store.sitio_web && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <a href={store.sitio_web} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                                            {store.sitio_web}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {store.notas && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 italic">"{store.notas}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStore ? 'Editar Tienda' : 'Nueva Tienda'}
            >
                <StoreForm
                    onSubmit={handleSubmit}
                    initialData={editingStore}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Stores;
