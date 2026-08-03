import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const COLORES_ESTADO = {
  aprobado: 'bg-green-500',
 _revision: 'bg-yellow-500',
  retrasado: 'bg-red-500',
  pendiente: 'bg-gray-400',
};

function ObtenerColorEstado(porcentaje) {
  if (porcentaje >= 80) return COLORES_ESTADO.aprobado;
  if (porcentaje >= 40) return COLORES_ESTADO._revision;
  return COLORES_ESTADO.retrasado;
}

export default function SeguimientoAvances({ proyectoId }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [avances, setAvances] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [progreso, setProgreso] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!proyectoId) return;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`/api/avances/proyecto/${proyectoId}`, { headers }).then((res) =>
        res.json()
      ),
      fetch(`/api/comentarios/proyecto/${proyectoId}`, { headers }).then((res) =>
        res.json()
      ),
    ])
      .then(([avancesData, comentariosData]) => {
        setAvances(Array.isArray(avancesData) ? avancesData : []);
        setComentarios(Array.isArray(comentariosData) ? comentariosData : []);
        if (avancesData.length > 0) {
          setProgreso(avancesData[avancesData.length - 1].porcentaje || 0);
        }
      })
      .catch(() => {
        setAvances([]);
        setComentarios([]);
      })
      .finally(() => setCargando(false));
  }, [proyectoId]);

  const handleSubirEvidencia = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setSubiendo(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('proyectoId', proyectoId);
      formData.append('archivo', archivo);

      const res = await fetch('/api/documentos/subir', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || 'Error al subir el documento');
      }

      setMensaje({ tipo: 'exito', texto: 'Documento subido exitosamente.' });

      const headers = { Authorization: `Bearer ${token}` };
      const avancesRes = await fetch(
        `/api/avances/proyecto/${proyectoId}`,
        { headers }
      );
      const avancesData = await avancesRes.json();
      setAvances(Array.isArray(avancesData) ? avancesData : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRegistrarAvance = async (descripcion, porcentaje) => {
    setSubiendo(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/avances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proyectoId: parseInt(proyectoId),
          descripcion,
          porcentaje: parseInt(porcentaje),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || 'Error al registrar el avance');
      }

      setMensaje({ tipo: 'exito', texto: 'Avance registrado exitosamente.' });
      setProgreso(parseInt(porcentaje));

      const headers = { Authorization: `Bearer ${token}` };
      const avancesRes = await fetch(
        `/api/avances/proyecto/${proyectoId}`,
        { headers }
      );
      const avancesData = await avancesRes.json();
      setAvances(Array.isArray(avancesData) ? avancesData : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setSubiendo(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Cargando seguimiento...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Seguimiento de Avances</h1>

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

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso General
          </span>
          <span className="text-sm font-bold text-gray-900">{progreso}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${ObtenerColorEstado(
              progreso
            )}`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de Entregas</h2>

          {avances.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay avances registrados aun.
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {[...avances].reverse().map((avance, index) => (
                  <div key={avance.id || index} className="relative pl-10">
                    <div
                      className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${ObtenerColorEstado(
                        avance.porcentaje
                      )}`}
                    />

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {avance.porcentaje}% completado
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(avance.fecha).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{avance.descripcion}</p>
                      {avance.usuario && (
                        <p className="text-xs text-gray-500 mt-2">
                          Por: {avance.usuario.nombres} {avance.usuario.apellidos}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Comentarios del Docente Asesor
          </h2>

          {comentarios.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay comentarios aun.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {[...comentarios].reverse().map((comentario, index) => (
                <div
                  key={comentario.id || index}
                  className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {comentario.usuario
                        ? `${comentario.usuario.nombres} ${comentario.usuario.apellidos}`
                        : 'Docente Asesor'}
                    </span>
                    <span className="text-xs text-blue-600">
                      {new Date(comentario.fecha).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">{comentario.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Cargar Nueva Evidencia</h2>

        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleSubirEvidencia}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            className={`px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 ${
              subiendo
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {subiendo ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Subiendo...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Seleccionar Archivo
              </>
            )}
          </button>
          <span className="text-sm text-gray-500">
            PDF, Word, JPG o PNG (max. 20 MB)
          </span>
        </div>
      </div>
    </div>
  );
}
