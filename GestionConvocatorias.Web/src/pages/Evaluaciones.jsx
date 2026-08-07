import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormularioEvaluacion from '../components/FormularioEvaluacion';
import { ClipboardCheck, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const TABS = [
  { id: 'asignadas', label: 'Asignadas' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'completadas', label: 'Completadas' },
];

function EstadoPill({ estado }) {
  const estilos = {
    Pendiente: 'bg-gray-100 text-gray-800',
    'En progreso': 'bg-blue-100 text-blue-800',
    Completada: 'bg-green-100 text-green-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        estilos[estado] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {estado}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function Evaluaciones() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [tabActivo, setTabActivo] = useState('asignadas');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/proyectos/AsignadosEvaluador', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al cargar proyectos');

      const data = await res.json();
      setProyectos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleExitoEvaluacion = () => {
    setProyectoSeleccionado(null);
    cargarProyectos();
  };

  const proyectosAsignados = proyectos.filter(
    (p) => p.estado === 'EnPropuesta' || p.estado === 'EnRevision'
  );

  const proyectosEnProgreso = proyectos.filter(
    (p) => p.estado === 'EnDesarrollo'
  );

  const proyectosCompletados = proyectos.filter(
    (p) => p.estado === 'Aprobado' || p.estado === 'Finalizado'
  );

  const proyectosPendientes = proyectos.filter(
    (p) => p.estado === 'Borrador' || p.estado === 'EnPropuesta'
  );

  const estadisticas = {
    asignadas: proyectosAsignados.length,
    enProgreso: proyectosEnProgreso.length,
    completadas: proyectosCompletados.length,
    pendientes: proyectosPendientes.length,
  };

  const proyectosFiltrados = (() => {
    switch (tabActivo) {
      case 'asignadas':
        return proyectosAsignados;
      case 'en_progreso':
        return proyectosEnProgreso;
      case 'completadas':
        return proyectosCompletados;
      default:
        return proyectosAsignados;
    }
  })();

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const obtenerEstado = (proyecto) => {
    const estadosMap = {
      Borrador: 'Pendiente',
      EnPropuesta: 'Pendiente',
      EnRevision: 'En progreso',
      EnDesarrollo: 'En progreso',
      Aprobado: 'Completada',
      Finalizado: 'Completada',
      Cancelado: 'Pendiente',
    };
    return estadosMap[proyecto.estado] || 'Pendiente';
  };

  if (proyectoSeleccionado) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setProyectoSeleccionado(null)}
          className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          &larr; Volver a la lista
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {proyectoSeleccionado.titulo}
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            {proyectoSeleccionado.categoria}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Estado: {proyectoSeleccionado.estado}
          </p>
          <p className="text-gray-700 mb-6">{proyectoSeleccionado.resumen}</p>

          <FormularioEvaluacion
            proyectoId={proyectoSeleccionado.id}
            onExito={handleExitoEvaluacion}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mis Evaluaciones</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ClipboardCheck}
          label="Asignadas"
          value={estadisticas.asignadas}
          color="#2563EB"
        />
        <StatCard
          icon={Clock}
          label="En progreso"
          value={estadisticas.enProgreso}
          color="#7C3AED"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completadas"
          value={estadisticas.completadas}
          color="#059669"
        />
        <StatCard
          icon={AlertCircle}
          label="Pendientes"
          value={estadisticas.pendientes}
          color="#D97706"
        />
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`py-3 text-sm font-medium transition-colors ${
                tabActivo === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Proyecto</th>
                  <th className="px-6 py-3 font-medium">Convocatoria</th>
                  <th className="px-6 py-3 font-medium">Fecha límite</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proyectosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No hay proyectos en esta categoría.
                    </td>
                  </tr>
                ) : (
                  proyectosFiltrados.map((proyecto) => (
                    <tr
                      key={proyecto.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {proyecto.titulo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {proyecto.categoria}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {proyecto.convocatoria?.titulo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(proyecto.fechaTermino)}
                      </td>
                      <td className="px-6 py-4">
                        <EstadoPill estado={obtenerEstado(proyecto)} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {proyecto.convocatoria?.linkRubrica ? (
                          <a
                            href={proyecto.convocatoria.linkRubrica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <ExternalLink size={16} />
                            Evaluar en Google Forms
                          </a>
                        ) : (
                          <button
                            onClick={() => setProyectoSeleccionado(proyecto)}
                            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Evaluar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
