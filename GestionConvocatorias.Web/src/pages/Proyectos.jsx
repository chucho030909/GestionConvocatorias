import { useState, useEffect } from 'react';
import api, {
  sugerirEvaluador,
  invitarEvaluador,
  rechazarEvaluador,
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

const ESTADO_PERMITIDOS = [
  { value: 'EnPropuesta', label: 'En propuesta' },
  { value: 'EnRevision', label: 'En revisión' },
  { value: 'Aprobado', label: 'Aprobado' },
  { value: 'EnDesarrollo', label: 'En desarrollo' },
  { value: 'Finalizado', label: 'Finalizado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

export default function Proyectos() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const tieneRol = (r) => roles.includes(r);

  const rol = tieneRol(ROLES.COORDINADOR) ? ROLES.COORDINADOR
    : tieneRol(ROLES.ADMINISTRADOR) ? ROLES.ADMINISTRADOR
    : tieneRol(ROLES.DOCENTE_ASESOR) ? ROLES.DOCENTE_ASESOR
    : tieneRol(ROLES.EVALUADOR) ? ROLES.EVALUADOR
    : ROLES.ESTUDIANTE;

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

  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [proyectoEstado, setProyectoEstado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');

  // Modal: asignación evaluador (Coordinador)
  const [isAsigModalOpen, setIsAsigModalOpen] = useState(false);
  const [proyectoAsignar, setProyectoAsignar] = useState(null);
  const [asignacion, setAsignacion] = useState({ evaluadorId: '' });
  const [evaluadores, setEvaluadores] = useState([]);

  // Modal: asignación docente asesor (Coordinador)
  const [isDocenteModalOpen, setIsDocenteModalOpen] = useState(false);
  const [proyectoDocente, setProyectoDocente] = useState(null);
  const [docenteAsesorId, setDocenteAsesorId] = useState('');
  const [docentes, setDocentes] = useState([]);

  // Modal: asesoría (DocenteAsesor)
  const [isAsesoriaModalOpen, setIsAsesoriaModalOpen] = useState(false);
  const [proyectoAsesoria, setProyectoAsesoria] = useState(null);
  const [asesoriaData, setAsesoriaData] = useState({
    titulo: '',
    descripcion: '',
    recomendaciones: '',
    tipoAsesoria: 'Tecnica',
    calificacion: '',
  });

  // Modal: personalizar rúbrica de convocatoria (Coordinador/Admin)
  const [isRubricaModalOpen, setIsRubricaModalOpen] = useState(false);
  const [proyectoRubrica, setProyectoRubrica] = useState(null);
  const [rubricaUrl, setRubricaUrl] = useState('');

  // IA
  const [evaluadoresSugeridos, setEvaluadoresSugeridos] = useState([]);
  const [proyectoEvaluadorId, setProyectoEvaluadorId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [procesandoInvitacion, setProcesandoInvitacion] = useState(null);

  const handleSeleccionarEvaluador = async (evaluadorId) => {
    setProcesandoInvitacion(evaluadorId);
    try {
      const res = await invitarEvaluador(proyectoEvaluadorId, evaluadorId);
      if (res.exito) {
        alert(res.mensaje);
        setShowModal(false);
        obtenerProyectos();
      } else {
        alert(res.mensaje || 'Error al invitar evaluador.');
      }
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al invitar evaluador.');
    } finally {
      setProcesandoInvitacion(null);
    }
  };

  const obtenerProyectos = () => {
    const ruta = RUTA_POR_ROL[rol] || '/proyectos/Todos';
    api
      .get(ruta)
      .then((res) => setProyectos(res.data))
      .catch(() => alert('Ocurrió un error al cargar los datos.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!user) return;
    obtenerProyectos();
    if (rol === ROLES.COORDINADOR) {
      api
        .get('/usuarios')
        .then((res) => {
          const maestros = res.data.filter((u) =>
            u.roles?.some((r) => [ROLES.DOCENTE_ASESOR, ROLES.EVALUADOR].includes(r))
          );
          setEvaluadores(maestros);
          setDocentes(maestros);
        })
        .catch(() => alert('Ocurrió un error al cargar los datos.'));
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
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const handleSubirArchivo = async (proyectoId) => {
    if (!archivo) return;
    const fd = new FormData();
    fd.append('proyectoId', proyectoId);
    fd.append('archivo', archivo);
    try {
      await api.post('/documentos/subir', fd);
      setArchivo(null);
    } catch (err) {
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
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
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
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
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    try {
      await asignarProyecto(proyectoAsignar, {
        evaluadorId: asignacion.evaluadorId ? Number(asignacion.evaluadorId) : null,
      });
      setIsAsigModalOpen(false);
      setProyectoAsignar(null);
      obtenerProyectos();
    } catch (err) {
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const handleAsignarDocente = async (e) => {
    e.preventDefault();
    try {
      await asignarProyecto(proyectoDocente, {
        docenteAsesorId: docenteAsesorId ? Number(docenteAsesorId) : null,
      });
      setIsDocenteModalOpen(false);
      setProyectoDocente(null);
      setDocenteAsesorId('');
      obtenerProyectos();
    } catch (err) {
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const handleAsesoriaInputChange = (e) => {
    const { name, value } = e.target;
    setAsesoriaData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAsesoriaSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/asesorias', {
        proyectoId: proyectoAsesoria,
        titulo: asesoriaData.titulo,
        descripcion: asesoriaData.descripcion,
        recomendaciones: asesoriaData.recomendaciones,
        tipoAsesoria: asesoriaData.tipoAsesoria,
        calificacion: asesoriaData.calificacion ? Number(asesoriaData.calificacion) : null,
      });
      setIsAsesoriaModalOpen(false);
      setProyectoAsesoria(null);
      setAsesoriaData({ titulo: '', descripcion: '', recomendaciones: '', tipoAsesoria: 'Tecnica', calificacion: '' });
    } catch (err) {
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const abrirModalRubrica = (proyecto) => {
    setProyectoRubrica(proyecto);
    setRubricaUrl(proyecto.convocatoria?.linkRubrica || '');
    setIsRubricaModalOpen(true);
  };

  const handleRubricaSubmit = async (e) => {
    e.preventDefault();
    if (!proyectoRubrica?.convocatoriaId) {
      alert('Este proyecto no tiene convocatoria asociada.');
      return;
    }
    try {
      const conv = proyectoRubrica.convocatoria;
      const payload = new FormData();
      payload.append('Clave', conv.clave);
      payload.append('Titulo', conv.titulo);
      payload.append('TipoConvocatoria', conv.tipoConvocatoria);
      payload.append('Descripcion', conv.descripcion || '');
      payload.append('Objetivo', conv.objetivo || '');
      payload.append('FechaPublicacion', conv.fechaPublicacion);
      payload.append('FechaApertura', conv.fechaApertura);
      payload.append('FechaLimiteRegistro', conv.fechaLimiteRegistro);
      payload.append('FechaEvaluacion', conv.fechaEvaluacion);
      payload.append('FechaCierre', conv.fechaCierre);
      payload.append('FechaPublicacionResultados', conv.fechaPublicacionResultados);
      payload.append('Categorias', conv.categorias || '[]');
      payload.append('Estado', conv.estado);
      payload.append('NumeroMaximoProyectos', conv.numeroMaximoProyectos);
      payload.append('NumeroMaximoIntegrantes', conv.numeroMaximoIntegrantes);
      payload.append('NumeroEvaluadoresPorProyecto', conv.numeroEvaluadoresPorProyecto);
      payload.append('EscalaEvaluacion', conv.escalaEvaluacion);
      payload.append('LinkRubrica', rubricaUrl.trim());
      await api.put(`/convocatorias/${proyectoRubrica.convocatoriaId}`, payload);
      setIsRubricaModalOpen(false);
      setProyectoRubrica(null);
      alert('Rúbrica actualizada correctamente.');
      obtenerProyectos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al actualizar la rúbrica.');
    }
  };

  const manejarSugerir = async (proyectoId) => {
    setCargandoIA(true);
    try {
      const sugeridos = await sugerirEvaluador(proyectoId);
      setEvaluadoresSugeridos(sugeridos);
      setProyectoEvaluadorId(proyectoId);
      setShowModal(true);
    } catch (err) {
      alert('Ocurrió un error. Por favor, intenta de nuevo.');
    } finally {
      setCargandoIA(false);
    }
  };

  const tituloModulo = tieneRol(ROLES.ESTUDIANTE) ? 'Mis Proyectos'
    : tieneRol(ROLES.DOCENTE_ASESOR) ? 'Proyectos Asignados'
    : tieneRol(ROLES.EVALUADOR) ? 'Proyectos a Evaluar'
    : tieneRol(ROLES.COORDINADOR) ? 'Proyectos (Vista Global)'
    : 'Todos los Proyectos';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tituloModulo}</h1>
        <div className="flex items-center gap-3">
          {tieneRol(ROLES.ESTUDIANTE) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium"
            >
              Registrar Proyecto
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
                  {tieneRol(ROLES.ESTUDIANTE) && (
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
                  {tieneRol(ROLES.DOCENTE_ASESOR) && (
                    <>
                      <button
                        onClick={() => {
                          setProyectoEstado(p.id);
                          setIsEstadoModalOpen(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-700"
                      >
                        Cambiar Estado
                      </button>
                      <button
                        onClick={() => {
                          setProyectoAsesoria(p.id);
                          setIsAsesoriaModalOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        Registrar Asesoría
                      </button>
                    </>
                  )}
                  {tieneRol(ROLES.EVALUADOR) && (
                    <>
                      <a
                        href={p.convocatoria?.linkRubrica || "https://docs.google.com/forms/d/e/1FAIpQLSflbor-6O_VoIweugafuXrM0akysL7AAjyLRgDILt5uLa0Qxg/viewform"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 inline-block"
                      >
                        Evaluar Proyecto
                      </a>
                      <button
                        onClick={async () => {
                          if (!window.confirm('¿Seguro que quieres rechazar este proyecto?')) return;
                          try {
                            await rechazarEvaluador(p.id);
                            alert('Has rechazado la evaluación de este proyecto.');
                            cargarProyectos();
                          } catch (err) {
                            alert(err.response?.data?.mensaje || 'Error al rechazar.');
                          }
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {tieneRol(ROLES.COORDINADOR) && (
                    <>
                      <button
                        onClick={() => {
                          setProyectoDocente(p.id);
                          setDocenteAsesorId(p.docenteAsesorId ?? '');
                          setIsDocenteModalOpen(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          p.docenteAsesor
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {p.docenteAsesor ? `asesor: ${p.docenteAsesor.nombres} ${p.docenteAsesor.apellidos}` : 'Asignar Docente'}
                      </button>
                      <button
                        onClick={() => {
                          setProyectoAsignar(p.id);
                          setAsignacion({ evaluadorId: p.evaluadorId ?? '' });
                          setIsAsigModalOpen(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          p.evaluador
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {p.evaluador ? `eval: ${p.evaluador.nombres} ${p.evaluador.apellidos}` : 'Asignar Evaluador'}
                      </button>
                      <button
                        onClick={() => abrirModalRubrica(p)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-yellow-700"
                        title="Personalizar la rúbrica de esta convocatoria"
                      >
                        Rúbrica
                      </button>
                    </>
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

      {/* Modal: Cambiar Estado (DocenteAsesor / Coordinador) */}
      {isEstadoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleCambiarEstado} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Cambiar Estado del Proyecto</h2>
            <select value={estadoSeleccionado} onChange={(e) => setEstadoSeleccionado(e.target.value)} className="w-full border p-2 mb-4 rounded">
              <option value="">Seleccione un estado</option>
              {ESTADO_PERMITIDOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsEstadoModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Asignar Docente Asesor (Coordinador) */}
      {isDocenteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleAsignarDocente} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Asignar Docente Asesor</h2>
            <label className="block text-sm text-gray-600 mb-1">Docente Asesor</label>
            <select value={docenteAsesorId} onChange={(e) => setDocenteAsesorId(e.target.value)} className="w-full border p-2 mb-4 rounded">
              <option value="">Sin asignar</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsDocenteModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Asignar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Asignación Evaluador (Coordinador) */}
      {isAsigModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleAsignar} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Asignar Evaluador</h2>
            <label className="block text-sm text-gray-600 mb-1">Seleccionar maestro existente</label>
            <select value={asignacion.evaluadorId} onChange={(e) => setAsignacion((p) => ({ ...p, evaluadorId: e.target.value }))} className="w-full border p-2 mb-3 rounded">
              <option value="">Sin asignar</option>
              {evaluadores.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nombres} {ev.apellidos}</option>
              ))}
            </select>
            <button type="button" onClick={() => { setIsAsigModalOpen(false); manejarSugerir(proyectoAsignar); }} disabled={cargandoIA} className="w-full mb-4 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-50">
              {cargandoIA ? 'Cargando...' : 'Sugerir con IA'}
            </button>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm text-gray-500 mb-3">¿No encuentras al maestro? Invítalo por correo</p>
              <input type="email" id="emailInvitacion" placeholder="correo@uttt.edu.mx" className="w-full border p-2 mb-2 rounded text-sm" />
              <button type="button" onClick={async () => {
                const email = document.getElementById('emailInvitacion')?.value;
                if (!email) return;
                try {
                  await api.post('/invitaciones', {
                    correoElectronico: email,
                    rol: 'Evaluador',
                    proyectoId: proyectoAsignar,
                    nombreCompleto: email.split('@')[0],
                  });
                  alert('Invitación enviada a ' + email);
                  document.getElementById('emailInvitacion').value = '';
                } catch (err) {
                  alert('Error al enviar invitación');
                }
              }} className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
                Enviar invitación
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsAsigModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Asignar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Registrar Asesoría (DocenteAsesor) */}
      {isAsesoriaModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleAsesoriaSubmit} className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Registrar Asesoría</h2>
            <label className="block text-sm text-gray-600 mb-1">Título *</label>
            <input type="text" name="titulo" value={asesoriaData.titulo} onChange={handleAsesoriaInputChange} required className="w-full border p-2 mb-3 rounded" placeholder="Ej: Revisión de arquitectura" />
            <label className="block text-sm text-gray-600 mb-1">Tipo de Asesoría *</label>
            <select name="tipoAsesoria" value={asesoriaData.tipoAsesoria} onChange={handleAsesoriaInputChange} className="w-full border p-2 mb-3 rounded">
              <option value="Tecnica">Técnica</option>
              <option value="Metodologica">Metodológica</option>
              <option value="General">General</option>
            </select>
            <label className="block text-sm text-gray-600 mb-1">Descripción *</label>
            <textarea name="descripcion" value={asesoriaData.descripcion} onChange={handleAsesoriaInputChange} required className="w-full border p-2 mb-3 rounded" rows="4" placeholder="Describe la asesoría realizada..." />
            <label className="block text-sm text-gray-600 mb-1">Recomendaciones</label>
            <textarea name="recomendaciones" value={asesoriaData.recomendaciones} onChange={handleAsesoriaInputChange} className="w-full border p-2 mb-3 rounded" rows="3" placeholder="Recomendaciones para el equipo..." />
            <label className="block text-sm text-gray-600 mb-1">Calificación (1-10, opcional)</label>
            <input type="number" name="calificacion" min="1" max="10" step="0.1" value={asesoriaData.calificacion} onChange={handleAsesoriaInputChange} className="w-full border p-2 mb-4 rounded" placeholder="Ej: 8.5" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsAsesoriaModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Rúbrica de convocatoria (Coordinador/Admin) */}
      {isRubricaModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={handleRubricaSubmit} className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2">Configurar Rúbrica de Evaluación</h2>
            {proyectoRubrica?.convocatoria && (
              <p className="text-sm text-gray-500 mb-4">
                Convocatoria: {proyectoRubrica.convocatoria.clave} — {proyectoRubrica.convocatoria.titulo}
              </p>
            )}
            <label className="block text-sm text-gray-600 mb-1">URL del formulario de rúbrica</label>
            <input
              type="url"
              value={rubricaUrl}
              onChange={(e) => setRubricaUrl(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
              placeholder="https://docs.google.com/forms/..."
            />
            <p className="text-xs text-gray-400 mb-4">
              Los evaluadores usarán esta URL al pulsar "Evaluar Proyecto". Déjalo vacío para usar la rúbrica por defecto.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsRubricaModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700">Guardar</button>
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
                  <div className="flex items-center gap-2">
                    <span className="text-purple-700 font-bold text-lg">#{i + 1}</span>
                    <button
                      onClick={() => handleSeleccionarEvaluador(e.id)}
                      disabled={procesandoInvitacion === e.id}
                      className="bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-60"
                    >
                      {procesandoInvitacion === e.id ? 'Enviando...' : 'Seleccionar'}
                    </button>
                  </div>
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
