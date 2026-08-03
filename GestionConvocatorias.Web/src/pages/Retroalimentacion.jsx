import { useState, useEffect } from 'react';
import { Star, Download } from 'lucide-react';
import api from '../services/api';

function Estrellas({ cantidad }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <Star
          key={estrella}
          size={16}
          className={
            estrella <= cantidad
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  );
}

function ItemInfo({ label, valor }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 mt-1">{valor}</p>
    </div>
  );
}

const CRITERIOS = [
  { key: 'calificacionInnovacion', label: 'Innovación' },
  { key: 'calificacionViabilidad', label: 'Viabilidad' },
  { key: 'calificacionImpactoSocial', label: 'Impacto Social' },
  { key: 'calificacionSustentabilidad', label: 'Sustentabilidad' },
  { key: 'calificacionModeloNegocio', label: 'Modelo de Negocio' },
];

export default function Retroalimentacion() {
  const [evaluacion, setEvaluacion] = useState(null);
  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const proyectoId = new URLSearchParams(window.location.search).get(
    'proyectoId'
  );

  useEffect(() => {
    if (!proyectoId) {
      setCargando(false);
      return;
    }

    Promise.all([
      api.get(`/evaluaciones/proyecto/${proyectoId}`),
      api.get(`/proyectos/${proyectoId}`),
    ])
      .then(([evalRes, projRes]) => {
        const evaluaciones = evalRes.data;
        if (evaluaciones && evaluaciones.length > 0) {
          setEvaluacion(evaluaciones[0]);
        }
        setProyecto(projRes.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Error al cargar la retroalimentación.');
      })
      .finally(() => setCargando(false));
  }, [proyectoId]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-gray-400">
          No hay retroalimentación disponible para este proyecto.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <nav className="text-sm text-gray-500">
        <span className="hover:text-gray-700 cursor-pointer">Mis proyectos</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800">Retroalimentación</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-800">
        Retroalimentación del proyecto
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <ItemInfo
            label="Proyecto"
            valor={proyecto?.titulo || 'Sin título'}
          />
          <ItemInfo
            label="Convocatoria"
            valor={proyecto?.convocatoria?.titulo || 'Sin convocatoria'}
          />
          <ItemInfo
            label="Calificación final"
            valor={
              <span className="text-3xl font-bold text-gray-800">
                {evaluacion.puntajeTotal?.toFixed(2) || '0.00'}
              </span>
            }
          />
          <ItemInfo label="Posición" valor="1 de 32" />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Comentarios del comité evaluador
          </h2>

          <div className="space-y-5">
            {CRITERIOS.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
                <Estrellas cantidad={evaluacion[key] || 0} />
              </div>
            ))}
          </div>

          {evaluacion.comentarios && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Observaciones generales
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {evaluacion.comentarios}
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} />
              Descargar retroalimentación (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
