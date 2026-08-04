import { useState, useEffect } from 'react';
import api, {
  sugerirEvaluador,
  actualizarEspecialidades,
  asignarProyecto,
  crearAvance,
} from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

const RUTA_POR_ROL = {
  [ROLES.ESTUDIANTE]: '/proyectos/MisProyectos',
  [ROLES.DOCENTE_ASESOR]: '/proyectos/AsignadosDocente',
  [ROLES.EVALUADOR]: '/proyectos/AsignadosEvaluador',
  [ROLES.COORDINADOR]: '/proyectos/Coordinador',
  [ROLES.ADMINISTRADOR]: '/proyectos/Todos',
};

const ESTADO_PERMITIDOS = ['En propuesta', 'En revisión', 'Aprobado', 'Retrasado'];

export default function Proyectos() {
  const { user } = useAuth();
  const rol = user?.role;

  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modal: nuevo proyecto (Estudiante)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    resumen: '',
    categoria: '',
    convocatoriaId: '',
  });
  const [archivo, setArchivo] = useState(null);

  // Modal: evaluación / rúbrica (Evaluador)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [proyectoAEvaluar, setProyectoAEvaluar] = useState(null);
  const [evalData, setEvalData] = useState({
    calificacionInnovacion: 1,
    calificacionViabilidad: 1,
    observacionesGenerales: '',
  });
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [proyectoEstado, setProyectoEstado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');

  // Modal: asignación (Coordinador)
  const [isAsigModalOpen, setIsAsigModalOpen] = useState(false);
  const [proyectoAsignar, setProyectoAsignar] = useState(null);
  const [asignacion, setAsignacion] = useState({ docenteAsesorId: '', evaluadorId: '' });
  const [docentes, setDocentes] = useState([]);
  const [evaluadores, setEvaluadores] = useState([]);

  // IA
  const [evaluadoresSugeridos, setEvaluadoresSugeridos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cargandoIA, setCargandoIA] = useState(false);

  const obtenerProyectos = () => {
    const ruta = RUTA_POR_ROL[rol] || '/proyectos/Todos';
    api
      .get(ruta)
      .then((res) => setProyectos(res.data))
      .catch((err) => console.error(err))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!user) return;
    obtenerProyectos();
    if (rol === ROLES.COORDINADOR) {
      api
        .get('/usuarios')
        .then((res) => {
          setDocentes(res.data.filter((u) => u.rol === ROLES.DOCENTE_ASESOR));
          setEvaluadores(res.data.filter((u) => u.rol === ROLES.EVALUADOR));
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/proyectos', formData);
      setIsModalOpen(false);
      setFormData({ titulo: '', resumen: '', categoria: '', convocatoriaId: '' });
      obtenerProyectos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubirArchivo = async (proyectoId) => {
    if (!archivo) return;
    const fd = new FormData();
    fd.append('proyectoId', proyectoId);
    fd.append('archivo', archivo);
    try {
      await api.post('/documentos/subir', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setArchivo(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvance = async (proyectoId) => {
    try {
      await crearAvance({
        proyectoId,
        descripcion: 'Avance de timeline',
        porcentaje: 0,
      });
      obtenerProyectos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvalInputChange = (e) => {
    const { name, value } = e.target;
    setEvalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evaluaciones/calificar', {
        proyectoId: proyectoAEvaluar,
        calificacionInnovacion: Number(evalData.calificacionInnovacion),
        calificacionViabilidad: Number(evalData.calificacionViabilidad),
        observacionesGenerales: evalData.observacionesGenerales,
      });
      setIsEvalModalOpen(false);
      setProyectoAEvaluar(null);
      setEvalData({ calificacionInnovacion: 1, calificacionViabilidad: 1, observacionesGenerales: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/proyectos/${proyectoEstado}/estado`, { estado: estadoSeleccionado });
      setIsEstadoModalOpen(false);
      setProyectoEstado(null);
      obtenerProyectos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    try {
      await asignarProyecto(proyectoAsignar, {
        docenteAsesorId: asignacion.docenteAsesorId ? Number(asignacion.docenteAsesorId) : null,
        evaluadorId: asignacion.evaluadorId ? Number(asignacion.evaluadorId) : null,
      });
      setIsAsigModalOpen(false);
      setProyectoAsignar(null);
      obtenerProyectos();
    } catch (err) {
      console.error(err);
    }
  };

  const manejarSugerir = async (proyectoId) => {
    setCargandoIA(true);
    try {
      const sugeridos = await sugerirEvaluador(proyectoId);
      setEvaluadoresSugeridos(sugeridos);
      setShowModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoIA(false);
    }
  };

  const tituloModulo = {
    [ROLES.ESTUDIANTE]: 'Mis Proyectos',
    [ROLES.DOCENTE_ASESOR]: 'Proyectos Asignados',
    [ROLES.EVALUADOR]: 'Proyectos a Evaluar',
    [ROLES.COORDINADOR]: 'Proyectos (Vista Global)',
    [ROLES.ADMINISTRADOR]: 'Todos los Proyectos',
  }[rol];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tituloModulo}</h1>
        <div className="flex items-center gap-3">
          {rol === ROLES.ESTUDIANTE && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium"
            >
              Registrar Proyecto
            </button>
          )}
          {(rol === ROLES.ADMINISTRADOR || rol === ROLES.COORDINADOR) && (
            <button
              onClick={() => manejarSugerir(0)}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600"
            >
              Probar IA
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <p className="text-gray-500 mt-6">Cargando…</p>
      ) : (
        <table className="w-full mt-6 bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((p) => (
              <tr key={p.id} className="border-t border-gray-200">
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3">{p.categoria}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-800 h-2.5 rounded-full" style={{ width: `${p.progreso || 0}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  {rol === ROLES.ESTUDIANTE && (
                    <>
                      <label className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-300">
                        Subir archivo
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            setArchivo(e.target.files[0]);
                            handleSubirArchivo(p.id);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => handleAvance(p.id)}
                        className="bg-teal-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-teal-700"
                      >
                        Avance
                      </button>
                    </>
                  )}
                  {rol === ROLES.DOCENTE_ASESOR && (
                    <button
                      onClick={() => {
                        setProyectoEstado(p.id);
                        setIsEstadoModalOpen(true);
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Cambiar Estado
                    </button>
                  )}
                  {rol === ROLES.EVALUADOR && (
                    <button
                      onClick={() => {
                        setProyectoAEvaluar(p.id);
                        setIsEvalModalOpen(true);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Aprobar Proyecto
                    </button>
                  )}
                  {rol === ROLES.COORDINADOR && (
                    <button
                      onClick={() => {
                        setProyectoAsignar(p.id);
                        setAsignacion({
                          docenteAsesorId: p.docenteAsesorId ?? '',
                          evaluadorId: p.evaluadorId ?? '',
                        });
                        setIsAsigModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      Asignar Tutores
                    </button>
                  )}
                  {rol === ROLES.ADMINISTRADOR && (
                    <button
                      onClick={() => manejarSugerir(p.id)}
                      disabled={cargandoIA}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {cargandoIA ? 'Cargando...' : 'Sugerir Evaluador'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No hay proyectos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Modal: Nuevo Proyecto (Estudiante) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Registrar Proyecto</h2>
            <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Título" className="w-full border p-2 mb-4 rounded" />
            <textarea name="resumen" value={formData.resumen} onChange={handleInputChange} placeholder="Resumen" className="w-full border p-2 mb-4 rounded" />
            <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border p-2 mb-4 rounded">
              <option value="">Seleccione una categoría</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Sostenibilidad">Sostenibilidad</option>
              <option value="Salud">Salud</option>
            </select>
            <input type="number" name="convocatoriaId" value={formData.convocatoriaId} onChange={handleInputChange} placeholder="Convocatoria ID" className="w-full border p-2 mb-4 rounded" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Evaluación / Rúbrica (Evaluador) */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleEvalSubmit} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rúbrica de Evaluación</h2>
            <label className="block text-sm text-gray-600 mb-1">Innovación (1-5)</label>
            <input type="number" name="calificacionInnovacion" min="1" max="5" value={evalData.calificacionInnovacion} onChange={handleEvalInputChange} className="w-full border p-2 mb-4 rounded" />
            <label className="block text-sm text-gray-600 mb-1">Viabilidad (1-5)</label>
            <input type="number" name="calificacionViabilidad" min="1" max="5" value={evalData.calificacionViabilidad} onChange={handleEvalInputChange} className="w-full border p-2 mb-4 rounded" />
            <textarea name="observacionesGenerales" value={evalData.observacionesGenerales} onChange={handleEvalInputChange} placeholder="Observaciones" className="w-full border p-2 mb-4 rounded" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsEvalModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">Aprobar Proyecto</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cambiar Estado (DocenteAsesor / Coordinador) */}
      {isEstadoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleCambiarEstado} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Cambiar Estado del Proyecto</h2>
            <select value={estadoSeleccionado} onChange={(e) => setEstadoSeleccionado(e.target.value)} className="w-full border p-2 mb-4 rounded">
              <option value="">Seleccione un estado</option>
              {ESTADO_PERMITIDOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsEstadoModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Asignación (Coordinador) */}
      {isAsigModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleAsignar} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Asignar Tutores</h2>
            <label className="block text-sm text-gray-600 mb-1">Docente Asesor</label>
            <select value={asignacion.docenteAsesorId} onChange={(e) => setAsignacion((p) => ({ ...p, docenteAsesorId: e.target.value }))} className="w-full border p-2 mb-4 rounded">
              <option value="">Sin asignar</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>
              ))}
            </select>
            <label className="block text-sm text-gray-600 mb-1">Evaluador</label>
            <select value={asignacion.evaluadorId} onChange={(e) => setAsignacion((p) => ({ ...p, evaluadorId: e.target.value }))} className="w-full border p-2 mb-4 rounded">
              <option value="">Sin asignar</option>
              {evaluadores.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nombres} {ev.apellidos}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsAsigModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Asignar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Evaluadores sugeridos (IA) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-700">Evaluadores Sugeridos</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Ordenados por compatibilidad con el proyecto.</p>
            <ul className="space-y-3">
              {evaluadoresSugeridos.map((e, i) => (
                <li key={e.id} className="flex items-center justify-between border border-purple-100 rounded-lg px-4 py-3 bg-purple-50">
                  <div>
                    <p className="font-semibold text-gray-800">{i + 1}. {e.nombres} {e.apellidos}</p>
                    <p className="text-sm text-gray-500">{e.correoElectronico}</p>
                    <p className="text-xs text-purple-600 mt-1">Especialidades: {e.especialidades || 'Sin especialidades'}</p>
                  </div>
                  <span className="text-purple-700 font-bold text-lg">#{i + 1}</span>
                </li>
              ))}
              {evaluadoresSugeridos.length === 0 && (
                <li className="text-gray-500 text-center py-4">No hay evaluadores disponibles.</li>
              )}
            </ul>
            <button onClick={() => setShowModal(false)} className="mt-6 w-full bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-900">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
