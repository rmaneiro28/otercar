import React, { useState } from 'react';
import { FileText, Plus, Trash2, Calendar, AlertTriangle, ExternalLink, Paperclip, Edit2, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';

const VehicleDocuments = ({ vehicleId }) => {
    const { documents, addDocument, updateDocument, deleteDocument, vehicles } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');
    const [vehicleFilter, setVehicleFilter] = useState(vehicleId || 'all');

    // Form State
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'RCV',
        fecha_vencimiento: '',
        vehiculo_id: vehicleId || '', // Default to the prop if available
    });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // Filter and Sort Logic
    const vehicleDocs = documents
        .filter(doc => {
            const matchesSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'Todos' || doc.tipo === filterType;
            const matchesVehicle = vehicleFilter === 'all' || doc.vehiculo_id === vehicleFilter;
            return matchesSearch && matchesType && matchesVehicle;
        })
        .sort((a, b) => {
            // Documentos con vencimiento primero
            if (a.fecha_vencimiento && !b.fecha_vencimiento) return -1;
            if (!a.fecha_vencimiento && b.fecha_vencimiento) return 1;
            if (!a.fecha_vencimiento && !b.fecha_vencimiento) return 0;
            // Ordenar por fecha (más próximo/vencido primero)
            return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
        });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    const handleEdit = (doc) => {
        setEditingDoc(doc);
        setFormData({
            titulo: doc.titulo,
            tipo: doc.tipo,
            fecha_vencimiento: doc.fecha_vencimiento || '',
            vehiculo_id: doc.vehiculo_id || '',
        });
        setPreview(doc.url_archivo?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? doc.url_archivo : null);
        setIsAdding(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const docPayload = {
            vehiculo_id: formData.vehiculo_id || null,
            titulo: formData.titulo,
            tipo: formData.tipo,
            fecha_vencimiento: formData.fecha_vencimiento || null,
        };

        let result;
        if (editingDoc) {
            result = await updateDocument(editingDoc.id, { ...editingDoc, ...docPayload }, file);
        } else {
            result = await addDocument(docPayload, file);
        }

        if (result.error) {
            toast.error(result.error.message || 'Error al guardar documento');
        } else {
            toast.success(editingDoc ? 'Documento actualizado' : 'Documento agregado');
            setIsAdding(false);
            setEditingDoc(null);
            setFormData({ titulo: '', tipo: 'RCV', fecha_vencimiento: '', vehiculo_id: vehicleId || '' });
            setFile(null);
            setPreview(null);
        }
        setUploading(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingDoc(null);
        setFormData({ titulo: '', tipo: 'RCV', fecha_vencimiento: '', vehiculo_id: vehicleId || '' });
        setFile(null);
        setPreview(null);
    };

    const handleDelete = async (doc) => {
        if (confirm('¿Eliminar este documento?')) {
            const { error } = await deleteDocument(doc.id, doc.url_archivo);
            if (error) toast.error('Error al eliminar');
            else toast.success('Documento eliminado');
        }
    };

    const getExpiryStatus = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        const expiry = new Date(dateString);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Vencido', color: 'text-red-500 bg-red-50 border-red-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
        if (diffDays < 30) return { label: `Vence en ${diffDays} días`, color: 'text-orange-500 bg-orange-50 border-orange-200', icon: <X className="w-3.5 h-3.5 rotate-45" /> }; // Usamos una X rotada como reloj o similar
        return { label: 'Vigente', color: 'text-green-500 bg-green-50 border-green-200', icon: <FileText className="w-3.5 h-3.5" /> };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Documentación
                </h3>
                <button
                    onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
                    className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? 'Cerrar' : 'Agregar'}
                </button>
            </div>

            {/* FILTERS & SEARCH */}
            {!isAdding && (
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder="Buscar documento..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full pt-1 overflow-x-auto no-scrollbar">
                        <select
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={vehicleFilter}
                            onChange={(e) => setVehicleFilter(e.target.value)}
                        >
                            <option value="all">Todos los Vehículos</option>
                            <option value="">General (Sin Vehículo)</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.marca}</option>
                            ))}
                        </select>

                        {['Todos', 'RCV', 'Certificado Médico', 'Licencia', 'Tarjeta de Propiedad'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterType === type
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ADD / EDIT FORM */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Título</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: Póliza de Seguro 2024"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option>RCV</option>
                                <option>Certificado Médico</option>
                                <option>Licencia</option>
                                <option>Tarjeta de Propiedad</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Vehículo Asociado</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={formData.vehiculo_id}
                                onChange={e => setFormData({ ...formData, vehiculo_id: e.target.value })}
                            >
                                <option value="">General / Ninguno</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Vencimiento (Opcional)</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={formData.fecha_vencimiento}
                                onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                {editingDoc ? 'Reemplazar Archivo (Opcional)' : 'Archivo (Imagen/PDF)'}
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-xs file:font-semibold
                                      file:bg-indigo-50 file:text-indigo-700
                                      hover:file:bg-indigo-100"
                                />
                            </div>
                        </div>
                    </div>

                    {preview && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Vista Previa:</p>
                            <div className="relative w-full max-w-md h-48 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setFile(null); setPreview(null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {uploading ? 'Guardando...' : editingDoc ? 'Actualizar Documento' : 'Guardar Documento'}
                        </button>
                    </div>
                </form>
            )}

            {/* LISTING AS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicleDocs.length === 0 ? (
                    <p className="text-center col-span-full text-slate-400 text-sm py-8 italic">No hay documentos registrados.</p>
                ) : (
                    vehicleDocs.map(doc => {
                        const status = getExpiryStatus(doc.fecha_vencimiento);
                        const isImage = doc.url_archivo?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);

                        return (
                            <div key={doc.id} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {/* CARD HEADER: Image Preview */}
                                <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    {doc.url_archivo ? (
                                        isImage ? (
                                            <img
                                                src={doc.url_archivo}
                                                alt={doc.titulo}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-500/50">
                                                <FileText className="w-12 h-12" />
                                                <span className="text-[10px] font-black uppercase text-slate-400">PDF Documento</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Paperclip className="w-12 h-12" />
                                        </div>
                                    )}

                                    {/* STATUS TAG ON TOP OF IMAGE */}
                                    {status && (
                                        <div className="absolute top-2 right-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm backdrop-blur-md flex items-center gap-1.5 ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </div>
                                    )}

                                    {/* TYPE TAG ON TOP OF IMAGE */}
                                    <div className="absolute top-2 left-2">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm backdrop-blur-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 ${doc.tipo === 'RCV' ? 'border-orange-200' : 'border-slate-200'}`}>
                                            {doc.tipo}
                                        </span>
                                    </div>
                                </div>

                                {/* CARD BODY */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 truncate" title={doc.titulo}>
                                        {doc.titulo}
                                    </h4>

                                    {/* VEHICLE INFO ON CARD */}
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                        {doc.vehiculo_id ? (
                                            <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                <span>{vehicles.find(v => v.id === doc.vehiculo_id)?.placa || 'Cargando...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-slate-500">Documento General</span>
                                            </>
                                        )}
                                    </div>

                                    {doc.fecha_vencimiento && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            {doc.url_archivo && (
                                                <a
                                                    href={doc.url_archivo}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Ver completo"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleEdit(doc)}
                                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(doc)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default VehicleDocuments;
