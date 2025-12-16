import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useData } from '../context/DataContext';
import { Calendar as CalendarIcon, Clock, AlertCircle, FileText, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import WhatsAppButton from '../components/UI/WhatsAppButton';
import Modal from '../components/UI/Modal';
import { toast } from 'sonner';

// Custom CSS for Calendar to match theme
const calendarStyles = `
  .react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; }
  .react-calendar__tile { padding: 1rem 0.5rem; position: relative; border-radius: 0.75rem; font-size: 0.9rem; font-weight: 500; }
  .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #e0e7ff; color: #4338ca; }
  .react-calendar__tile--now { background: #f1f5f9; color: #0f172a; font-weight: bold; }
  .react-calendar__tile--active { background: #4f46e5 !important; color: white !important; box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.4); }
  .react-calendar__navigation button { font-size: 1.1rem; font-weight: bold; color: #1e293b; }
  .react-calendar__month-view__weekdays { text-transform: uppercase; font-size: 0.75rem; font-weight: bold; color: #64748b; margin-bottom: 0.5rem; }
  .dark .react-calendar__tile:enabled:hover, .dark .react-calendar__tile:enabled:focus { background-color: #3730a3; color: #e0e7ff; }
  .dark .react-calendar__tile--now { background: #1e293b; color: #f8fafc; }
  .dark .react-calendar__navigation button { color: #f8fafc; }
  .dark .react-calendar__navigation button:enabled:hover, .dark .react-calendar__navigation button:enabled:focus { background-color: #334155; }
  .dark .react-calendar__month-view__days__day--weekend { color: #fca5a5; }
`;

const CalendarPage = () => {
    const { documents, vehicles, owners, events, recommendations, addEvent, deleteEvent } = useData();
    const [date, setDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Event Form State
    const [newEvent, setNewEvent] = useState({
        titulo: '',
        descripcion: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora: '09:00',
        nombre_contacto: '',
        telefono_contacto: '',
        tipo: 'general'
    });

    const handleAddEvent = async (e) => {
        e.preventDefault();
        const fullDate = new Date(`${newEvent.fecha}T${newEvent.hora}:00`);

        const result = await addEvent({
            titulo: newEvent.titulo,
            descripcion: newEvent.descripcion,
            fecha: fullDate.toISOString(), // Standardize
            tipo: newEvent.tipo,
            nombre_contacto: newEvent.nombre_contacto,
            telefono_contacto: newEvent.telefono_contacto
        });

        if (result.error) {
            toast.error('Error al crear evento.');
        } else {
            toast.success('Evento creado exitosamente.');
            setIsModalOpen(false);
            setNewEvent({ ...newEvent, titulo: '', descripcion: '', nombre_contacto: '', telefono_contacto: '' });
        }
    };

    const handleDeleteEvent = async (id) => {
        if (confirm('¿Estás seguro de eliminar este evento?')) {
            const result = await deleteEvent(id);
            if (result.success) toast.success('Evento eliminado.');
            else toast.error('Error al eliminar.');
        }
    };

    // --- AGGREGATE EVENTS ---
    const getEvents = () => {
        const aggregated = [];

        // 1. Document Expirations
        documents.forEach(doc => {
            if (doc.fecha_vencimiento) {
                const expiryDate = parseISO(doc.fecha_vencimiento);
                if (isValid(expiryDate)) {
                    const vehicle = vehicles.find(v => v.id === doc.vehiculo_id);
                    const owner = vehicle ? owners.find(o => o.id === vehicle.propietario_id) : null;

                    aggregated.push({
                        id: `doc-${doc.id}`,
                        date: expiryDate,
                        type: 'document',
                        title: `Vence: ${doc.tipo}`,
                        rawTitle: doc.tipo,
                        subtitle: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Vehículo',
                        priority: 'high',
                        color: 'bg-red-500',
                        ownerPhone: owner?.telefono,
                        ownerName: owner?.nombre_completo || 'Cliente',
                        isManual: false
                    });
                }
            }
        });

        // 2. Custom Events
        events.forEach(ev => {
            const evDate = new Date(ev.fecha);
            if (isValid(evDate)) {
                aggregated.push({
                    realId: ev.id,
                    id: `ev-${ev.id}`,
                    date: evDate,
                    type: 'custom',
                    title: ev.titulo,
                    subtitle: ev.descripcion || 'Evento Personalizado',
                    color: 'bg-blue-500',
                    ownerPhone: ev.telefono_contacto,
                    ownerName: ev.nombre_contacto || 'Cliente',
                    rawTitle: ev.titulo,
                    isManual: true
                });
            }
        });

        // 3. AI Recommendations (Maintenance)
        recommendations.forEach(rec => {
            try {
                const content = JSON.parse(rec.contenido);
                // Look for 'fecha_estimada' (new format) or try to parse 'estimado' if it looks like a date
                let targetDate = null;

                if (content.fecha_estimada && isValid(parseISO(content.fecha_estimada))) {
                    targetDate = parseISO(content.fecha_estimada);
                } else if (content.estimado && typeof content.estimado === 'string' && content.estimado.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Fallback if 'estimado' happens to be a date string
                    targetDate = parseISO(content.estimado);
                }

                if (targetDate) {
                    const vehicle = vehicles.find(v => v.id === rec.vehiculo_id);
                    const owner = vehicle ? owners.find(o => o.id === vehicle.propietario_id) : null;

                    aggregated.push({
                        id: `rec-${rec.id}`,
                        date: targetDate,
                        type: 'maintenance',
                        title: `Sugerencia IA: ${content.recomendacion}`,
                        subtitle: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Vehículo',
                        priority: content.prioridad || 'Media',
                        color: 'bg-yellow-500', // Amber/Yellow for warnings
                        ownerPhone: owner?.telefono,
                        ownerName: owner?.nombre_completo || 'Cliente',
                        rawTitle: content.recomendacion,
                        isManual: false
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });

        return aggregated;
    };

    const allEvents = getEvents();

    const getTileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const dayEvents = allEvents.filter(ev => isSameDay(ev.date, date));
        if (dayEvents.length > 0) {
            return (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${ev.color}`}></div>
                    ))}
                    {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>}
                </div>
            );
        }
    };

    const selectedDayEvents = allEvents.filter(ev => isSameDay(ev.date, date));

    return (
        <div className="space-y-6">
            <style>{calendarStyles}</style>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Agenda & Recordatorios
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona vencimientos y citas importantes.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Evento</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CALENDAR VIEW */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <Calendar
                        onChange={setDate}
                        value={date}
                        tileContent={getTileContent}
                        className="dark:bg-slate-900 dark:text-white dark:border-slate-800"
                        locale="es-ES"
                        onClickDay={(value) => {
                            // Double click logic
                            const now = new Date().getTime();
                            const lastClick = sessionStorage.getItem('lastClickTime');
                            const lastDate = sessionStorage.getItem('lastClickDate');

                            if (lastClick && (now - lastClick) < 300 && lastDate === value.toISOString()) {
                                // Double click detected
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                if (value >= today) {
                                    setNewEvent(prev => ({ ...prev, fecha: format(value, 'yyyy-MM-dd') }));
                                    setIsModalOpen(true);
                                } else {
                                    toast.error('Solo puedes crear eventos en fechas futuras.');
                                }
                            }

                            sessionStorage.setItem('lastClickTime', now);
                            sessionStorage.setItem('lastClickDate', value.toISOString());
                        }}
                    />
                </div>

                {/* EVENTS LIST */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Eventos del {format(date, "d 'de' MMMM", { locale: es })}
                    </h3>

                    {selectedDayEvents.length > 0 ? (
                        <div className="space-y-3">
                            {selectedDayEvents.map(event => (
                                <div key={event.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group relative">
                                    {event.isManual && (
                                        <button
                                            onClick={() => handleDeleteEvent(event.realId)}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="flex items-start gap-3 w-full pr-6">
                                        <div className={`mt-1 p-1.5 rounded-full ${event.type === 'document' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                            {event.type === 'document' ? <FileText className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{event.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{event.subtitle}</p>
                                        </div>
                                        {event.ownerPhone && (
                                            <WhatsAppButton
                                                phone={event.ownerPhone}
                                                message={event.isManual
                                                    ? `Hola ${event.ownerName}, te escribo de OterCar para recordarte: ${event.rawTitle} el día ${format(event.date, 'dd/MM/yyyy')}.`
                                                    : `Hola ${event.ownerName}, recordatorio de OterCar: El documento "${event.rawTitle}" de tu ${event.subtitle} vence el ${format(event.date, 'dd/MM/yyyy')}.`
                                                }
                                                compact={true}
                                                className="shrink-0"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nada programado para hoy.</p>
                            <p className="text-xs opacity-70">¡Todo al día!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Logic */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Evento / Cita">
                <form onSubmit={handleAddEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            placeholder="Ej. Cita Cambio de Aceite"
                            value={newEvent.titulo}
                            onChange={(e) => setNewEvent({ ...newEvent, titulo: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                            <input
                                required
                                type="date"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                value={newEvent.fecha}
                                onChange={(e) => setNewEvent({ ...newEvent, fecha: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                            <input
                                required
                                type="time"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                value={newEvent.hora}
                                onChange={(e) => setNewEvent({ ...newEvent, hora: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción (Opcional)</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            rows="2"
                            value={newEvent.descripcion}
                            onChange={(e) => setNewEvent({ ...newEvent, descripcion: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase">Para Recordatorio WhatsApp (Opcional)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Contacto</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Juan Pérez"
                                    value={newEvent.nombre_contacto}
                                    onChange={(e) => setNewEvent({ ...newEvent, nombre_contacto: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="+57 300 123 4567"
                                    value={newEvent.telefono_contacto}
                                    onChange={(e) => setNewEvent({ ...newEvent, telefono_contacto: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Guardar Evento</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CalendarPage;
