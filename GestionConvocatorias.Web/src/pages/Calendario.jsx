import { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import api from '../services/api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendario() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const puedeCrear = roles.some(r => [ROLES.ADMINISTRADOR, ROLES.COORDINADOR].includes(r));

  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipoEvento: 'General',
  });

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/calendario');
      setEventos(res.data);
    } catch (err) {
      alert('Error al cargar eventos.');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calendario', {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fechaInicio: new Date(formData.fechaInicio).toISOString(),
        fechaFin: new Date(formData.fechaFin).toISOString(),
        tipoEvento: formData.tipoEvento,
      });
      setShowModal(false);
      setFormData({ titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', tipoEvento: 'General' });
      cargarEventos();
    } catch (err) {
      alert('Error al guardar el evento. Intenta de nuevo.');
    }
  };

  const diasEnMes = (año, mes) => new Date(año, mes + 1, 0).getDate();
  const primerDiaDelMes = (año, mes) => new Date(año, mes, 1).getDay();

  const año = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const totalDias = diasEnMes(año, mes);
  const primerDia = primerDiaDelMes(año, mes);

  const diasCalendario = [];
  for (let i = 0; i < primerDia; i++) {
    diasCalendario.push(null);
  }
  for (let d = 1; d <= totalDias; d++) {
    diasCalendario.push(d);
  }

  const eventosDelDia = (dia) => {
    if (!dia) return [];
    const fechaDia = new Date(año, mes, dia);
    return eventos.filter(e => {
      const inicio = new Date(e.fechaInicio);
      const fin = new Date(e.fechaFin);
      return fechaDia >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()) &&
             fechaDia <= new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    });
  };

  const navigateMonth = (dir) => {
    setFechaActual(new Date(año, mes + dir, 1));
  };

  const esHoy = (dia) => {
    const hoy = new Date();
    return dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
  };

  const tipoColor = (tipo) => {
    const colores = {
      General: 'bg-blue-100 text-blue-800',
      Convocatoria: 'bg-green-100 text-green-800',
      Entrega: 'bg-red-100 text-red-800',
      Evaluacion: 'bg-purple-100 text-purple-800',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
        {puedeCrear && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            Nuevo evento
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {MESES[mes]} {año}
          </h2>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DIAS.map((dia) => (
            <div key={dia} className="text-center text-xs font-medium text-gray-500 py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((dia, idx) => {
              const eventosDia = eventosDelDia(dia);
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] p-2 rounded-lg border border-gray-100 ${
                    dia ? 'hover:bg-gray-50' : ''
                  } ${esHoy(dia) ? 'bg-gray-900 text-white' : ''}`}
                >
                  {dia && (
                    <>
                      <p className={`text-sm font-medium mb-1 ${esHoy(dia) ? 'text-white' : 'text-gray-700'}`}>
                        {dia}
                      </p>
                      <div className="space-y-1">
                        {eventosDia.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => setEventoSeleccionado(ev)}
                            className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate ${
                              esHoy(dia) ? 'bg-white/20 text-white' : tipoColor(ev.tipoEvento)
                            }`}
                          >
                            {ev.titulo}
                          </button>
                        ))}
                        {eventosDia.length > 2 && (
                          <p className={`text-xs ${esHoy(dia) ? 'text-white/70' : 'text-gray-400'}`}>
                            +{eventosDia.length - 2} más
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nuevo evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo Evento</h2>
            <label className="block text-sm font-medium text-gray-600 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows="3"
            />
            <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={formData.tipoEvento}
              onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="General">General</option>
              <option value="Convocatoria">Convocatoria</option>
              <option value="Entrega">Entrega</option>
              <option value="Evaluacion">Evaluación</option>
            </select>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Inicio *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fin *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle evento */}
      {eventoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{eventoSeleccionado.titulo}</h2>
              <button onClick={() => setEventoSeleccionado(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${tipoColor(eventoSeleccionado.tipoEvento)}`}>
              {eventoSeleccionado.tipoEvento}
            </span>
            {eventoSeleccionado.descripcion && (
              <p className="text-sm text-gray-600 mb-4">{eventoSeleccionado.descripcion}</p>
            )}
            <div className="space-y-2 text-sm text-gray-500">
              <p><Calendar size={14} className="inline mr-2" />
                Inicio: {new Date(eventoSeleccionado.fechaInicio).toLocaleString('es-MX')}
              </p>
              <p><Calendar size={14} className="inline mr-2" />
                Fin: {new Date(eventoSeleccionado.fechaFin).toLocaleString('es-MX')}
              </p>
            </div>
            <button
              onClick={() => setEventoSeleccionado(null)}
              className="mt-6 w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
