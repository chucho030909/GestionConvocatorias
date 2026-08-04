import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Download, Calendar, Tag } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIAS = [
  'Todas',
  'Innovación', 'Tecnología', 'Salud', 'Medio ambiente',
  'Emprendimiento', 'Investigación', 'Desarrollo de software', 'Otra',
];

export default function Reportes() {
  const { user } = useAuth();
  if (user?.role !== 'Administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [historico, setHistorico] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    manejarBuscar();
  }, []);

  const manejarBuscar = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const params = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      if (categoria && categoria !== 'Todas') params.categoria = categoria;
      const res = await api.get('/reportes/historico', { params });
      setHistorico(res.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo obtener el histórico.');
    } finally {
      setCargando(false);
    }
  };

  const manejarExportar = async (proyectoId) => {
    try {
      await exportarProyecto(proyectoId);
    } catch (err) {
      console.error(err);
    }
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setCategoria('Todas');
    manejarBuscar();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">Consulta el histórico de proyectos por período y categoría.</p>
      </div>

      <form onSubmit={manejarBuscar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Calendar size={14} /> Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Calendar size={14} /> Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Tag size={14} /> Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Search size={16} />
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

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
                  <th className="px-6 py-3 font-medium">Categoría</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Convocatoria</th>
                  <th className="px-6 py-3 font-medium">Integrantes</th>
                  <th className="px-6 py-3 font-medium">Promedio</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No hay proyectos para mostrar. Ajusta los filtros y vuelve a buscar.
                    </td>
                  </tr>
                ) : (
                  historico.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{p.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.cuatrimestre || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.categoria}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.convocatoria || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {p.integrantes?.length ? p.integrantes.filter(Boolean).join(', ') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          {p.puntajeFinal?.toFixed(2) ?? '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => manejarExportar(p.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Download size={14} />
                          Exportar
                        </button>
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
