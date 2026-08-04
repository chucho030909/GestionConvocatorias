import { useState } from 'react';

const CRITERIOS = [
  { key: 'calificacionInnovacion', label: 'Innovación', peso: '25%' },
  { key: 'calificacionViabilidad', label: 'Viabilidad', peso: '20%' },
  { key: 'calificacionImpactoSocial', label: 'Impacto Social', peso: '20%' },
  { key: 'calificacionSustentabilidad', label: 'Sustentabilidad', peso: '15%' },
  { key: 'calificacionModeloNegocio', label: 'Modelo de Negocio', peso: '20%' },
];

function Estrellas({ valor, onSeleccionar }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <button
          key={estrella}
          type="button"
          onClick={() => onSeleccionar(estrella)}
          onMouseEnter={() => setHover(estrella)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors focus:outline-none"
          aria-label={`${estrella} estrella${estrella > 1 ? 's' : ''}`}
        >
          <span
            className={
              estrella <= (hover || valor)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }
          >
            &#9733;
          </span>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500 self-center">
        {valor > 0 ? `${valor}/5` : 'Sin calificar'}
      </span>
    </div>
  );
}

export default function FormularioEvaluacion({ proyectoId, onExito }) {
  const [calificaciones, setCalificaciones] = useState({
    calificacionInnovacion: 0,
    calificacionViabilidad: 0,
    calificacionImpactoSocial: 0,
    calificacionSustentabilidad: 0,
    calificacionModeloNegocio: 0,
  });

  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleCalificacion = (campo, valor) => {
    setCalificaciones((prev) => ({ ...prev, [campo]: valor }));
  };

  const puntajeTotal = () => {
    const pesos = {
      calificacionInnovacion: 0.25,
      calificacionViabilidad: 0.20,
      calificacionImpactoSocial: 0.20,
      calificacionSustentabilidad: 0.15,
      calificacionModeloNegocio: 0.20,
    };
    let total = 0;
    for (const [key, peso] of Object.entries(pesos)) {
      total += calificaciones[key] * peso;
    }
    return Math.round(total * 100) / 100;
  };

  const todosCalificados = Object.values(calificaciones).every((v) => v > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!todosCalificados) {
      setMensaje({
        tipo: 'error',
        texto: 'Debe calificar los 5 criterios antes de enviar.',
      });
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/evaluaciones/calificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proyectoId,
          ...calificaciones,
          observacionesGenerales,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || 'Error al enviar la evaluación');
      }

      const data = await res.json();

      setMensaje({
        tipo: 'exito',
        texto: `Evaluación registrada exitosamente. Puntaje total: ${data.puntajeTotal}`,
      });

      setCalificaciones({
        calificacionInnovacion: 0,
        calificacionViabilidad: 0,
        calificacionImpactoSocial: 0,
        calificacionSustentabilidad: 0,
        calificacionModeloNegocio: 0,
      });
      setObservacionesGenerales('');

      if (onExito) onExito(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mensaje && (
        <div
          className={`p-4 rounded-lg ${
            mensaje.tipo === 'exito'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Criterios de Evaluación
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Califique cada criterio del 1 al 5 haciendo clic en las estrellas.
        </p>

        <div className="space-y-5">
          {CRITERIOS.map(({ key, label, peso }) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="ml-2 text-xs text-gray-400">
                  (Peso: {peso})
                </span>
              </div>
              <Estrellas
                valor={calificaciones[key]}
                onSeleccionar={(v) => handleCalificacion(key, v)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-800">
            Puntaje ponderado estimado:{' '}
          </span>
          <span className="text-lg font-bold text-blue-600">
            {puntajeTotal()}
          </span>
          <span className="text-sm text-blue-600"> / 5.00</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          value={observacionesGenerales}
          onChange={(e) => setObservacionesGenerales(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Escriba sus observaciones generales sobre el proyecto..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando || !todosCalificados}
          className={`px-6 py-3 rounded-lg font-medium text-white ${
            enviando || !todosCalificados
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {enviando ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar Evaluación'
          )}
        </button>
      </div>
    </form>
  );
}
