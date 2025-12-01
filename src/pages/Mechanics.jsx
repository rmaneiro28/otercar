import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Wrench, Edit2, Trash2, Search, Phone, MapPin } from 'lucide-react';
import Modal from '../components/UI/Modal';
import MechanicForm from '../components/Forms/MechanicForm';
import { toast } from 'sonner';

const Mechanics = () => {
    const { mechanics, addMechanic, updateMechanic, deleteMechanic } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMechanic, setEditingMechanic] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = () => {
        setEditingMechanic(null);
        setIsModalOpen(true);
    };

    const handleEdit = (mechanic) => {
        setEditingMechanic(mechanic);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este mecánico?')) {
            const result = await deleteMechanic(id);
            if (result && result.error) {
                toast.error('Error al eliminar mecánico');
            } else {
                toast.success('Mecánico eliminado correctamente');
            }
        }
    };

    const handleSubmit = async (data) => {
        let result;
        if (editingMechanic) {
            result = await updateMechanic(editingMechanic.id, data);
            if (result && result.error) {
                toast.error('Error al actualizar mecánico');
            } else {
                toast.success('Mecánico actualizado correctamente');
                setIsModalOpen(false);
            }
        } else {
            result = await addMechanic(data);
            if (result && result.error) {
                toast.error('Error al agregar mecánico');
            } else {
                toast.success('Mecánico agregado correctamente');
                setIsModalOpen(false);
            }
        }
    };

    const filteredMechanics = mechanics.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.especialidad && m.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mecánicos</h1>
                    <p className="text-slate-500">Directorio de mecánicos y talleres de confianza.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Mecánico</span>
                </button>
            </div>

            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            {mechanics.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wrench className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No hay mecánicos registrados</h3>
                    <p className="text-slate-500 mb-6">Agrega tus mecánicos de confianza.</p>
                    <button
                        onClick={handleAdd}
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                    >
                        Agregar Mecánico
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMechanics.map((mechanic) => (
                        <div key={mechanic.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{mechanic.nombre}</h3>
                                        <p className="text-slate-500 text-sm">{mechanic.especialidad || 'General'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(mechanic)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(mechanic.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                {mechanic.telefono && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{mechanic.telefono}</span>
                                    </div>
                                )}
                                {mechanic.direccion && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{mechanic.direccion}</span>
                                    </div>
                                )}
                            </div>

                            {mechanic.notas && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 italic">"{mechanic.notas}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMechanic ? 'Editar Mecánico' : 'Nuevo Mecánico'}
            >
                <MechanicForm
                    onSubmit={handleSubmit}
                    initialData={editingMechanic}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Mechanics;
