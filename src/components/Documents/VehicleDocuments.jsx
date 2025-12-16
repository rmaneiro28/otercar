import React, { useState } from 'react';
import { FileText, Plus, Trash2, Calendar, AlertTriangle, ExternalLink, Paperclip } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';

const VehicleDocuments = ({ vehicleId }) => {
    const { documents, addDocument, deleteDocument } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'Seguro',
        fecha_vencimiento: '',
    });
    const [file, setFile] = useState(null);

    const vehicleDocs = documents.filter(d => d.vehiculo_id === vehicleId);

    // Filter Logic
    // const expiredDocs = vehicleDocs.filter(d => d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date());
    // const activeDocs = vehicleDocs.filter(d => !d.fecha_vencimiento || new Date(d.fecha_vencimiento) >= new Date());

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const newDoc = {
            vehiculo_id: vehicleId,
            titulo: formData.titulo,
            tipo: formData.tipo,
            fecha_vencimiento: formData.fecha_vencimiento || null,
        };

        const { error } = await addDocument(newDoc, file);

        if (error) {
            toast.error(error.message || 'Error al guardar documento');
        } else {
            toast.success('Documento agregado');
            setIsAdding(false);
            setFormData({ titulo: '', tipo: 'Seguro', fecha_vencimiento: '' });
            setFile(null);
        }
        setUploading(false);
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

        if (diffDays < 0) return { label: 'Vencido', color: 'text-red-500 bg-red-50 border-red-200' };
        if (diffDays < 30) return { label: `Vence en ${diffDays} días`, color: 'text-orange-500 bg-orange-50 border-orange-200' };
        return { label: 'Vigente', color: 'text-green-500 bg-green-50 border-green-200' };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Documentación
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                >
                    {isAdding ? 'Cancelar' : '+ Agregar Documento'}
                </button>
            </div>

            {/* ADD FORM */}
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
                                <option>Seguro</option>
                                <option>Licencia / Tarjeta Propiedad</option>
                                <option>Tecnomecanica / Revisión</option>
                                <option>Impuestos</option>
                                <option>Otro</option>
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
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Archivo (Imagen/PDF)</label>
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
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {uploading ? 'Guardando...' : 'Guardar Documento'}
                        </button>
                    </div>
                </form>
            )}

            {/* LIST */}
            <div className="grid grid-cols-1 gap-3">
                {vehicleDocs.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4 italic">No hay documentos registrados.</p>
                ) : (
                    vehicleDocs.map(doc => {
                        const status = getExpiryStatus(doc.fecha_vencimiento);
                        return (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                        {doc.tipo === 'Seguro' ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">{doc.titulo}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{doc.tipo}</span>
                                            {doc.fecha_vencimiento && (
                                                <span className="flex items-center gap-1">
                                                    • <Calendar className="w-3 h-3" /> {new Date(doc.fecha_vencimiento).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {status && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                                            {status.label}
                                        </span>
                                    )}

                                    {doc.url_archivo && (
                                        <a
                                            href={doc.url_archivo}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                            title="Ver Archivo"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}

                                    <button
                                        onClick={() => handleDelete(doc)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
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
