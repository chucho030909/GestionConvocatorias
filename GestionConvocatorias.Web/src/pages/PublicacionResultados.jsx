import { useState, useEffect } from 'react';
import { Trophy, Download, Medal, Eye } from 'lucide-react';
import api, { getRanking } from '../services/api';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'ganadores', label: 'Ganadores' },
  { id: 'todos', label: 'Todos los proyectos' },
];

function BadgePosicion({ posicion, size = 'md' }) {
  const estilos = {
    1: 'bg-yellow-400 text-white',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-yellow-600 text-white',
  };

  const tamanos = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${estilos[posicion] || 'bg-gray-200 text-gray-600'} ${tamanos[size]}`}
    >
      {posicion}
    </div>
  );
}

function TarjetaPodio({ proyecto, posicion, esCentro }) {
  const borderColores = {
    1: 'border-yellow-400',
    2: 'border-gray-300',
    3: 'border-yellow-600',
  };

  const sombras = {
    1: 'shadow-lg',
    2: 'shadow-md',
    3: 'shadow-md',
  };

  const tamanos = esCentro
    ? 'w-72 h-72'
    : 'w-64';

  const alturas = {
    1: 'h-72',
    2: 'h-56',
    3: 'h-48',
  };

  return (
    <div
      className={`bg-white ${sombras[posicion]} rounded-t-xl p-${esCentro ? '6' : '4'} ${tamanos} ${alturas[posicion]} border-t-4 ${borderColores[posicion]} flex flex-col items-center text-center ${esCentro ? 'z-10' : ''}`}
    >
      <BadgePosicion posicion={posicion} size={esCentro ? 'lg' : 'md'} />

      <h3 className="font-bold text-gray-800 mt-3 text-sm leading-tight">
        {proyecto?.titulo || 'Sin proyecto'}
      </h3>

      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
        {proyecto?.integrantes?.join(', ') || 'Sin equipo'}
      </p>

      <p className="text-sm font-semibold text-gray-700 mt-2">
        Calificación: {proyecto?.promedioPuntaje?.toFixed(1) || '0.0'}
      </p>

      <button className="mt-auto pt-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
        Ver detalle
      </button>
    </div>
  );
}

export default function PublicacionResultados() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState('');
  const [ranking, setRanking] = useState([]);
  const [tabActivo, setTabActivo] = useState('ganadores');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get('/convocatorias')
      .then((res) => {
        setConvocatorias(res.data);
        if (res.data.length > 0) {
          setConvocatoriaSeleccionada(res.data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!convocatoriaSeleccionada) return;

    setCargando(true);
    getRanking(convocatoriaSeleccionada)
      .then((data) => setRanking(data))
      .catch((err) => console.error(err))
      .finally(() => setCargando(false));
  }, [convocatoriaSeleccionada]);

  const primero = ranking[0] || null;
  const segundo = ranking[1] || null;
  const tercero = ranking[2] || null;

  const convocatoriaActual = convocatorias.find(
    (c) => c.id === Number(convocatoriaSeleccionada)
  );

  const nombreConvocatoria = convocatoriaActual?.titulo || 'Resultados';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Convocatoria
          </label>
          <select
            value={convocatoriaSeleccionada}
            onChange={(e) => setConvocatoriaSeleccionada(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {convocatorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          Resultados - {nombreConvocatoria}
        </h1>
      </div>

      <div className="bg-gray-100 p-1 rounded-lg inline-flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActivo(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tabActivo === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {tabActivo === 'resumen' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                ¡Felicidades a los ganadores!
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Los proyectos han sido evaluados y los resultados oficiales de la
                convocatoria <strong>{nombreConvocatoria}</strong> se muestran a
                continuación.
              </p>

              {ranking.length > 0 && (
                <div className="mt-8 bg-gray-50 rounded-xl p-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Total de proyectos evaluados:
                  </p>
                  <p className="text-4xl font-bold text-gray-800">
                    {ranking.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {tabActivo === 'ganadores' && (
            <div className="flex flex-col items-center">
              <div className="flex items-end justify-center gap-4 mt-4">
                {segundo && (
                  <TarjetaPodio
                    proyecto={segundo}
                    posicion={2}
                    esCentro={false}
                  />
                )}
                {primero && (
                  <TarjetaPodio
                    proyecto={primero}
                    posicion={1}
                    esCentro={true}
                  />
                )}
                {tercero && (
                  <TarjetaPodio
                    proyecto={tercero}
                    posicion={3}
                    esCentro={false}
                  />
                )}
              </div>

              {!primero && !segundo && !tercero && (
                <div className="text-center py-12 text-gray-400">
                  <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No hay proyectos con evaluaciones en esta convocatoria.</p>
                </div>
              )}
            </div>
          )}

          {tabActivo === 'todos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="px-6 py-3 font-medium">#</th>
                      <th className="px-6 py-3 font-medium">Proyecto</th>
                      <th className="px-6 py-3 font-medium">Equipo</th>
                      <th className="px-6 py-3 font-medium">Categoría</th>
                      <th className="px-6 py-3 font-medium">Calificación</th>
                      <th className="px-6 py-3 font-medium text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ranking.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          No hay proyectos en el ranking.
                        </td>
                      </tr>
                    ) : (
                      ranking.map((proyecto, index) => (
                        <tr
                          key={proyecto.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <BadgePosicion posicion={index + 1} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">
                              {proyecto.titulo}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {proyecto.integrantes?.join(', ') || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {proyecto.categoria}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                              {proyecto.promedioPuntaje?.toFixed(1) || '0.0'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                              <Eye size={14} />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-center pt-4">
        <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={16} />
          Descargar acta de resultados
        </button>
      </div>
    </div>
  );
}
