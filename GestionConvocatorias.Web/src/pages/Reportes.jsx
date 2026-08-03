import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerHistorico, exportarProyecto } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reportes() {
  const { user } = useAuth();
  if (user?.role !== 'Administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  const [cuatrimestre, setCuatrimestre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [historico, setHistorico] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarBuscar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerHistorico({ cuatrimestre, categoria });
      setHistorico(datos);
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <form
        onSubmit={manejarBuscar}
        className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg shadow-md mb-6"
      >
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Cuatrimestre</label>
          <input
            type="text"
            value={cuatrimestre}
            onChange={(e) => setCuatrimestre(e.target.value)}
            placeholder="Ej. 2026-C1"
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Categoría</label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej. Tecnología"
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50"
        >
          {cargando ? 'Cargando...' : 'Filtrar'}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3">Proyecto</th>
            <th className="px-4 py-3">Cuatrimestre</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Postulante</th>
            <th className="px-4 py-3">Promedio Calificación</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((p) => (
            <tr key={p.id} className="border-t border-gray-200">
              <td className="px-4 py-3 font-medium">{p.titulo}</td>
              <td className="px-4 py-3">{p.cuatrimestre ?? '—'}</td>
              <td className="px-4 py-3">{p.categoria}</td>
              <td className="px-4 py-3">{p.postulante ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                  {p.puntajeFinal ?? 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => manejarExportar(p.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Exportar PDF
                </button>
              </td>
            </tr>
          ))}
          {historico.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                No hay proyectos para mostrar. Usa los filtros para consultar el histórico.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
