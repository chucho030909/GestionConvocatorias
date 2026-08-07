import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, CheckCircle, Clock, FileText, Upload,
  Users, Award, FolderOpen, Plus, ExternalLink, Package, Download, GitBranch
} from 'lucide-react';
import api, { obtenerMiProyectoEnConvocatoria, crearProyecto, obtenerAvancesPorProyecto, crearAvance, descargarArchivo, crearRepositorio } from '../services/api';
import CrearProyectoModal from '../components/CrearProyectoModal';
import ListaAvances from '../components/ListaAvances';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EstadoPill({ estado }) {
  const estilos = {
    Activa: 'bg-green-100 text-green-800',
    Cerrada: 'bg-red-100 text-red-800',
    'En registro': 'bg-blue-100 text-blue-800',
    'En evaluación': 'bg-yellow-100 text-yellow-800',
    Finalizada: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado}
    </span>
  );
}

function EstadoProyectoPill({ estado }) {
  const estilos = {
    EnPropuesta: 'bg-blue-100 text-blue-800',
    EnRevision: 'bg-yellow-100 text-yellow-800',
    Aprobado: 'bg-green-100 text-green-800',
    EnDesarrollo: 'bg-purple-100 text-purple-800',
    Finalizado: 'bg-gray-100 text-gray-800',
    Cancelado: 'bg-red-100 text-red-800',
  };
  const labels = {
    EnPropuesta: 'En Propuesta',
    EnRevision: 'En Revisión',
    Aprobado: 'Aprobado',
    EnDesarrollo: 'En Desarrollo',
    Finalizado: 'Finalizado',
    Cancelado: 'Cancelado',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
      {labels[estado] || estado}
    </span>
  );
}

export default function ConvocatoriaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [convocatoria, setConvocatoria] = useState(null);
  const [miProyecto, setMiProyecto] = useState(null);
  const [avances, setAvances] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showCrearProyecto, setShowCrearProyecto] = useState(false);
  const [showSubirAvance, setShowSubirAvance] = useState(false);
  const [descripcionAvance, setDescripcionAvance] = useState('');
  const [documentoAvance, setDocumentoAvance] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [creandoRepo, setCreandoRepo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const [convRes, proyectoRes] = await Promise.all([
        api.get(`/convocatorias/${id}`),
        obtenerMiProyectoEnConvocatoria(id),
      ]);
      setConvocatoria(convRes.data);
      setMiProyecto(proyectoRes.tieneProyecto ? proyectoRes : null);

      if (proyectoRes.tieneProyecto) {
        const avancesRes = await obtenerAvancesPorProyecto(proyectoRes.id);
        setAvances(avancesRes);
      }
    } catch (err) {
      alert('Error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  const handleProyectoCreado = () => {
    setShowCrearProyecto(false);
    cargarDatos();
  };

  const handleSubirAvance = async () => {
    if (!descripcionAvance.trim()) {
      alert('La descripción es obligatoria.');
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('proyectoId', miProyecto.id);
      formData.append('descripcion', descripcionAvance);
      if (documentoAvance) {
        formData.append('documento', documentoAvance);
      }
      await crearAvance(formData);
      setDescripcionAvance('');
      setDocumentoAvance(null);
      setShowSubirAvance(false);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al subir avance.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleCrearRepositorio = async () => {
    setCreandoRepo(true);
    try {
      const resultado = await crearRepositorio(miProyecto.id);
      setMiProyecto({ ...miProyecto, gitHubUrl: resultado.githubUrl });
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al crear el repositorio.');
    } finally {
      setCreandoRepo(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!convocatoria) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Convocatoria no encontrada.</p>
        <button onClick={() => navigate('/convocatorias')} className="mt-4 text-blue-600 hover:underline">
          Volver a convocatorias
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/convocatorias')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a convocatorias
      </button>

      {/* Header de la convocatoria */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {convocatoria.clave}
              </span>
              <EstadoPill estado={convocatoria.estado} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{convocatoria.titulo}</h1>
            <p className="text-sm text-gray-500 mt-1">{convocatoria.tipoConvocatoria}</p>
          </div>
        </div>

        {convocatoria.descripcion && (
          <p className="text-sm text-gray-600 mb-4">{convocatoria.descripcion}</p>
        )}

        {convocatoria.objetivo && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Objetivo</h3>
            <p className="text-sm text-gray-600">{convocatoria.objetivo}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span>Apertura: {formatearFecha(convocatoria.fechaApertura)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span>Límite registro: {formatearFecha(convocatoria.fechaLimiteRegistro)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span>Evaluación: {formatearFecha(convocatoria.fechaEvaluacion)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span>Cierre: {formatearFecha(convocatoria.fechaCierre)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-green-600 font-medium">Registrado en esta convocatoria</span>
        </div>
      </div>

      {/* Sección Mi Proyecto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FolderOpen size={20} />
            Mi Proyecto
          </h2>
        </div>

        {!miProyecto ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">Aún no has creado un proyecto para esta convocatoria.</p>
            <button
              onClick={() => setShowCrearProyecto(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Título</label>
                <p className="text-sm font-medium text-gray-800">{miProyecto.titulo}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Equipo</label>
                <p className="text-sm font-medium text-gray-800">{miProyecto.nombreEquipo}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Folio</label>
                <p className="text-sm font-mono text-gray-600">{miProyecto.folio || 'Sin asignar'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Estado</label>
                <div><EstadoProyectoPill estado={miProyecto.estado} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Categoría</label>
                <p className="text-sm text-gray-600">{miProyecto.categoria}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Progreso (según tiempo)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ width: `${miProyecto.progreso}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{miProyecto.progreso}%</span>
                </div>
              </div>
            </div>

            {/* Integrantes */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Integrantes ({miProyecto.integrantes?.length || 0}/{convocatoria.numeroMaximoIntegrantes})
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {miProyecto.integrantes?.map((i) => (
                  <span key={i.usuarioId} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    <Users size={12} />
                    {i.nombre || i.email}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Los integrantes se definen al crear el proyecto.</p>
            </div>

            {/* Docente Asesor y Evaluador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Docente Asesor</label>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {miProyecto.docenteAsesor
                    ? `${miProyecto.docenteAsesor.nombres} ${miProyecto.docenteAsesor.apellidos}`
                    : <span className="text-gray-400 italic">Sin asignar</span>
                  }
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Evaluador</label>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {miProyecto.evaluador
                    ? `${miProyecto.evaluador.nombres} ${miProyecto.evaluador.apellidos}`
                    : <span className="text-gray-400 italic">Sin asignar</span>
                  }
                </p>
              </div>
            </div>

            {/* Propuesta PDF */}
            {miProyecto.rutaPropuestaPDF && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Propuesta</label>
                <div className="mt-1">
                  <a
                    href={descargarArchivo(miProyecto.rutaPropuestaPDF)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <FileText size={16} />
                    Ver propuesta (PDF)
                  </a>
                </div>
              </div>
            )}

            {/* Código Fuente */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Código Fuente</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {miProyecto.rutaCodigoFuente && (
                  <a
                    href={descargarArchivo(miProyecto.rutaCodigoFuente)}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <Package size={16} />
                    Descargar código (ZIP)
                    <Download size={14} className="text-gray-400" />
                  </a>
                )}
                {miProyecto.gitHubUrl && (
                  <a
                    href={miProyecto.gitHubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm transition-colors"
                  >
                    <ExternalLink size={16} />
                    Ver en GitHub
                  </a>
                )}
                {!miProyecto.gitHubUrl && (
                  <button
                    onClick={handleCrearRepositorio}
                    disabled={creandoRepo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <GitBranch size={16} />
                    {creandoRepo ? 'Creando repositorio...' : 'Crear Repositorio en GitHub'}
                  </button>
                )}
              </div>
            </div>

            {/* Avances */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award size={16} />
                  Avances ({avances.length})
                </h3>
                <button
                  onClick={() => setShowSubirAvance(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-xs font-medium transition-colors"
                >
                  <Upload size={14} />
                  Agregar Avance
                </button>
              </div>

              {avances.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                  No hay avances registrados aún.
                </p>
              ) : (
                <ListaAvances avances={avances} />
              )}
            </div>

            {/* Formulario subir avance */}
            {showSubirAvance && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Nuevo Avance</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Descripción *</label>
                    <textarea
                      value={descripcionAvance}
                      onChange={(e) => setDescripcionAvance(e.target.value)}
                      rows={3}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe el avance del proyecto..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Documento (PDF)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setDocumentoAvance(e.target.files[0])}
                      className="mt-1 w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowSubirAvance(false)}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubirAvance}
                      disabled={subiendo}
                      className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {subiendo ? 'Subiendo...' : 'Guardar Avance'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear Proyecto */}
      {showCrearProyecto && (
        <CrearProyectoModal
          convocatoriaId={parseInt(id)}
          convocatoriaMaxIntegrantes={convocatoria.numeroMaximoIntegrantes}
          categorias={convocatoria.categorias}
          onClose={() => setShowCrearProyecto(false)}
          onCreado={handleProyectoCreado}
        />
      )}
    </div>
  );
}
