import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, Search, Shield, Mail, Phone, Plus, X, Save } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { toast } from 'sonner';

import UpgradeModal from '../components/UI/UpgradeModal';

const Owners = () => {
    const { owners, addClient, company } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        nombre_completo: '',
        email: '',
        telefono: '',
        direccion: ''
    });

    const filteredOwners = owners.filter(owner =>
        owner.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (owner.email && owner.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAddClient = async (e) => {
        e.preventDefault();
        const result = await addClient(newClient);
        if (result && result.error) {
            if (result.error.message && result.error.message.includes('limitado')) {
                setIsModalOpen(false);
                setIsUpgradeModalOpen(true);
            } else {
                toast.error(result.error.message || 'Error al agregar cliente');
            }
        } else {
            toast.success('Cliente agregado correctamente');
            setIsModalOpen(false);
            setNewClient({ nombre_completo: '', email: '', telefono: '', direccion: '' });
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clientes / Propietarios</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona los propietarios de los vehículos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                />
            </div>

            {owners.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No hay clientes registrados</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Comienza agregando tu primer cliente.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 hover:underline"
                    >
                        Agregar Cliente
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOwners.map((owner) => (
                        <div key={owner.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg uppercase">
                                        {owner.nombre_completo.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{owner.nombre_completo}</h3>
                                        <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit mt-1">
                                            <Shield className="w-3 h-3" />
                                            <span className="capitalize">Cliente</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                                {owner.email && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{owner.email}</span>
                                    </div>
                                )}
                                {owner.telefono && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{owner.telefono}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuevo Cliente"
            >
                <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            value={newClient.nombre_completo}
                            onChange={(e) => setNewClient({ ...newClient, nombre_completo: e.target.value })}
                            required
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Opcional)</label>
                        <input
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="cliente@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono (Opcional)</label>
                        <input
                            type="tel"
                            value={newClient.telefono}
                            onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="+58 412 1234567"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección (Opcional)</label>
                        <textarea
                            value={newClient.direccion}
                            onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-24 text-slate-800 dark:text-white"
                            placeholder="Dirección del cliente..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cliente
                        </button>
                    </div>
                </form>
            </Modal>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                currentPlan={company?.plan || 'free'}
            />
        </div>
    );
};

export default Owners;
