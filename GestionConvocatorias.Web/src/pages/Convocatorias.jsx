import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, X, ChevronRight, ChevronLeft, FileText, Download, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

const CATEGORIAS_OPCIONES = [
  'Innovación', 'Tecnología', 'Salud', 'Medio ambiente',
  'Emprendimiento', 'Investigación', 'Desarrollo de software', 'Otra',
];

const ESTADOS_OPCIONES = ['Activa', 'Cerrada', 'En registro', 'En evaluación', 'Finalizada'];

const SECCIONES = [
  { key: 'general', label: 'Información General' },
  { key: 'fechas', label: 'Fechas Clave' },
  { key: 'config', label: 'Configuración' },
  { key: 'docs', label: 'Documentos' },
];

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

function BotonAcciones({ convocatoria, onEditar, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setAbierto(!abierto)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <MoreHorizontal size={18} />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
            <button onClick={() => { onEditar(convocatoria); setAbierto(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
            <button onClick={() => { onEliminar(convocatoria.id); setAbierto(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

function generarClave(total) {
  const anio = new Date().getFullYear();
  return `CONV-${anio}-${String(total + 1).padStart(2, '0')}`;
}

function hoyISO() {
  return new Date().toISOString().split('T')[0];
}

function validarSeccionGeneral(f) {
  const e = {};
  if (!f.titulo.trim()) e.titulo = 'El nombre es obligatorio.';
  else if (f.titulo.trim().length < 5) e.titulo = 'Mínimo 5 caracteres.';
  else if (f.titulo.trim().length > 150) e.titulo = 'Máximo 150 caracteres.';
  if (!f.tipoConvocatoria) e.tipoConvocatoria = 'Seleccione un tipo.';
  if (f.descripcion && f.descripcion.length > 500) e.descripcion = 'Máximo 500 caracteres.';
  if (f.objetivo && f.objetivo.length > 500) e.objetivo = 'Máximo 500 caracteres.';
  return e;
}

function validarSeccionFechas(f) {
  const e = {};
  const pub = f.fechaPublicacion;
  const apertura = f.fechaApertura;
  const limReg = f.fechaLimiteRegistro;
  const cierre = f.fechaCierre;
  const evaluacion = f.fechaEvaluacion;
  const pubRes = f.fechaPublicacionResultados;

  if (!apertura) e.fechaApertura = 'La fecha de apertura es obligatoria.';

  if (pub && apertura && pub > apertura) e.fechaApertura = 'Debe ser igual o posterior a la fecha de publicación.';
  if (apertura && limReg && apertura > limReg) e.fechaLimiteRegistro = 'Debe ser igual o posterior a la apertura.';
  if (limReg && cierre && limReg > cierre) e.fechaCierre = 'Debe ser igual o posterior al límite de registro.';
  if (cierre && evaluacion && cierre >= evaluacion) e.fechaEvaluacion = 'Debe ser posterior a la fecha de cierre.';
  if (evaluacion && pubRes && evaluacion > pubRes) e.fechaPublicacionResultados = 'Debe ser igual o posterior a la evaluación.';

  return e;
}

function validarSeccionConfig(f) {
  const e = {};
  if (!f.numeroMaximoProyectos || f.numeroMaximoProyectos < 1) e.numeroMaximoProyectos = 'Mínimo 1 proyecto.';
  else if (f.numeroMaximoProyectos > 500) e.numeroMaximoProyectos = 'Máximo 500 proyectos.';
  if (!f.numeroMaximoIntegrantes || f.numeroMaximoIntegrantes < 2) e.numeroMaximoIntegrantes = 'Mínimo 2 integrantes.';
  else if (f.numeroMaximoIntegrantes > 10) e.numeroMaximoIntegrantes = 'Máximo 10 integrantes.';
  if (!f.numeroEvaluadoresPorProyecto || f.numeroEvaluadoresPorProyecto < 1) e.numeroEvaluadoresPorProyecto = 'Mínimo 1 evaluador.';
  else if (f.numeroEvaluadoresPorProyecto > 5) e.numeroEvaluadoresPorProyecto = 'Máximo 5 evaluadores.';
  return e;
}

export default function Convocatorias() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    clave: '', titulo: '', tipoConvocatoria: '', descripcion: '', objetivo: '',
    fechaPublicacion: '', fechaApertura: '', fechaLimiteRegistro: '', fechaEvaluacion: '',
    fechaCierre: '', fechaPublicacionResultados: '', categorias: [], estado: 'Activa',
    numeroMaximoProyectos: 50, numeroMaximoIntegrantes: 5, numeroEvaluadoresPorProyecto: 2,
    escalaEvaluacion: 5,
  });
  const [archivos, setArchivos] = useState({ bases: null, convocatoria: null, formatos: null });
  const [archivosExistentes, setArchivosExistentes] = useState({ bases: null, convocatoria: null, formatos: null });
  const [seccionActiva, setSeccionActiva] = useState('general');
  const [errores, setErrores] = useState({});

  const puedeEditar = user?.roles?.some((r) => [ROLES.ADMINISTRADOR, ROLES.COORDINADOR].includes(r));

  useEffect(() => {
    api.get('/convocatorias')
      .then((res) => setConvocatorias(res.data))
      .catch(() => alert('Error al cargar las convocatorias.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      if (seccionActiva === 'general') setErrores(validarSeccionGeneral(formData));
      else if (seccionActiva === 'fechas') setErrores(validarSeccionFechas(formData));
      else if (seccionActiva === 'config') setErrores(validarSeccionConfig(formData));
      else setErrores({});
    }
  }, [formData, seccionActiva, isModalOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriaToggle = (cat) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const todosErrores = {
      ...validarSeccionGeneral(formData),
      ...validarSeccionFechas(formData),
      ...validarSeccionConfig(formData),
    };
    if (Object.keys(todosErrores).length > 0) {
      setErrores(todosErrores);
      setSeccionActiva(Object.keys(todosErrores)[0].startsWith('fecha') ? 'fechas' : 'general');
      return;
    }

    const payload = new FormData();
    payload.append('Clave', formData.clave);
    payload.append('Titulo', formData.titulo.trim());
    payload.append('TipoConvocatoria', formData.tipoConvocatoria);
    payload.append('Descripcion', formData.descripcion.trim());
    payload.append('Objetivo', formData.objetivo.trim());
    payload.append('FechaPublicacion', formData.fechaPublicacion ? new Date(formData.fechaPublicacion + 'T12:00:00').toISOString() : '');
    payload.append('FechaApertura', formData.fechaApertura ? new Date(formData.fechaApertura + 'T12:00:00').toISOString() : '');
    payload.append('FechaLimiteRegistro', formData.fechaLimiteRegistro ? new Date(formData.fechaLimiteRegistro + 'T12:00:00').toISOString() : '');
    payload.append('FechaEvaluacion', formData.fechaEvaluacion ? new Date(formData.fechaEvaluacion + 'T12:00:00').toISOString() : '');
    payload.append('FechaCierre', formData.fechaCierre ? new Date(formData.fechaCierre + 'T12:00:00').toISOString() : '');
    payload.append('FechaPublicacionResultados', formData.fechaPublicacionResultados ? new Date(formData.fechaPublicacionResultados + 'T12:00:00').toISOString() : '');
    payload.append('Categorias', JSON.stringify(formData.categorias));
    payload.append('Estado', formData.estado);
    payload.append('NumeroMaximoProyectos', Number(formData.numeroMaximoProyectos));
    payload.append('NumeroMaximoIntegrantes', Number(formData.numeroMaximoIntegrantes));
    payload.append('NumeroEvaluadoresPorProyecto', Number(formData.numeroEvaluadoresPorProyecto));
    payload.append('EscalaEvaluacion', Number(formData.escalaEvaluacion));
    payload.append('LinkRubrica', 'https://docs.google.com/forms/d/e/1FAIpQLSdXDZtzd8jrGtR-_DK8VQX6VLAsdAeU5H4CCiDIuUlz-BdP7A/viewform');
    if (archivos.bases) payload.append('basesPDF', archivos.bases);
    if (archivos.convocatoria) payload.append('convocatoriaPDF', archivos.convocatoria);
    if (archivos.formatos) payload.append('formatos', archivos.formatos);

    try {
      if (editandoId) await api.put(`/convocatorias/${editandoId}`, payload);
      else await api.post('/convocatorias', payload);
      cerrarModal();
      const res = await api.get('/convocatorias');
      setConvocatorias(res.data);
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.errores?.join(', ') || JSON.stringify(err.response?.data) || err.message;
      alert('Error al guardar la convocatoria: ' + msg);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta convocatoria?')) return;
    try {
      await api.delete(`/convocatorias/${id}`);
      setConvocatorias((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { alert('Error al eliminar la convocatoria.'); }
  };

  const handleEditar = (conv) => {
    let cats = [];
    try { cats = JSON.parse(conv.categorias || '[]'); } catch {}
    setFormData({
      clave: conv.clave || '',
      titulo: conv.titulo || '',
      tipoConvocatoria: conv.tipoConvocatoria || '',
      descripcion: conv.descripcion || '',
      objetivo: conv.objetivo || '',
      fechaPublicacion: conv.fechaPublicacion?.split('T')[0] || '',
      fechaApertura: conv.fechaApertura?.split('T')[0] || '',
      fechaLimiteRegistro: conv.fechaLimiteRegistro?.split('T')[0] || '',
      fechaEvaluacion: conv.fechaEvaluacion?.split('T')[0] || '',
      fechaCierre: conv.fechaCierre?.split('T')[0] || '',
      fechaPublicacionResultados: conv.fechaPublicacionResultados?.split('T')[0] || '',
      categorias: cats,
      estado: conv.estado || 'Activa',
      numeroMaximoProyectos: conv.numeroMaximoProyectos ?? 50,
      numeroMaximoIntegrantes: conv.numeroMaximoIntegrantes ?? 5,
      numeroEvaluadoresPorProyecto: conv.numeroEvaluadoresPorProyecto ?? 2,
      escalaEvaluacion: conv.escalaEvaluacion ?? 5,
    });
    setArchivosExistentes({
      bases: conv.rutaBases || null,
      convocatoria: conv.rutaConvocatoriaPDF || null,
      formatos: conv.rutaFormatos || null,
    });
    setEditandoId(conv.id);
    setSeccionActiva('general');
    setIsModalOpen(true);
  };

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setFormData({
      clave: generarClave(convocatorias.length),
      titulo: '', tipoConvocatoria: '', descripcion: '', objetivo: '',
      fechaPublicacion: hoyISO(), fechaApertura: '', fechaLimiteRegistro: '', fechaEvaluacion: '',
      fechaCierre: '', fechaPublicacionResultados: '', categorias: [], estado: 'Activa',
      numeroMaximoProyectos: 50, numeroMaximoIntegrantes: 5, numeroEvaluadoresPorProyecto: 2,
      escalaEvaluacion: 5,
    });
    setSeccionActiva('general');
    setErrores({});
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditandoId(null);
    setSeccionActiva('general');
    setErrores({});
    setArchivos({ bases: null, convocatoria: null, formatos: null });
    setArchivosExistentes({ bases: null, convocatoria: null, formatos: null });
  };

  const convocatoriasFiltradas = convocatorias.filter(
    (c) => c.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || c.clave?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const indiceSeccion = SECCIONES.findIndex((s) => s.key === seccionActiva);
  const seccionesValidadas = [
    Object.keys(validarSeccionGeneral(formData)).length === 0,
    Object.keys(validarSeccionFechas(formData)).length === 0,
    Object.keys(validarSeccionConfig(formData)).length === 0,
    true,
  ];
  const puedeAvanzar = seccionesValidadas[indiceSeccion];

  const siguienteSeccion = () => {
    if (indiceSeccion < SECCIONES.length - 1 && puedeAvanzar) {
      setSeccionActiva(SECCIONES[indiceSeccion + 1].key);
    }
  };

  const anteriorSeccion = () => {
    if (indiceSeccion > 0) setSeccionActiva(SECCIONES[indiceSeccion - 1].key);
  };

  const campoError = (campo) =>
    errores[campo] ? <p className="text-xs text-red-500 mt-1">{errores[campo]}</p> : null;

  const inputClase = (campo) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
      errores[campo] ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Convocatorias</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por título o clave..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64" />
          </div>
          {puedeEditar && (
            <button onClick={abrirModalNuevo} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} /> Nueva convocatoria
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Clave</th>
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Inicio</th>
                  <th className="px-6 py-3 font-medium">Cierre</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {convocatoriasFiltradas.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No se encontraron convocatorias.</td></tr>
                ) : convocatoriasFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{c.clave}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{c.titulo}</p>
                      {c.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.descripcion}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.tipoConvocatoria || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatearFecha(c.fechaApertura)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatearFecha(c.fechaCierre)}</td>
                    <td className="px-6 py-4"><EstadoPill estado={c.estado} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/convocatorias/${c.id}`)} title="Ver detalle"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                          <Eye size={18} />
                        </button>
                        {puedeEditar && <BotonAcciones convocatoria={c} onEditar={handleEditar} onEliminar={handleEliminar} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editandoId ? 'Editar Convocatoria' : 'Nueva Convocatoria'}</h2>
              <button type="button" onClick={cerrarModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex border-b border-gray-100 px-6">
              {SECCIONES.map((s, i) => {
                const completada = seccionesValidadas[i];
                const esActual = seccionActiva === s.key;
                const puedeIr = completada || esActual || (i === indiceSeccion + 1 && seccionesValidadas[indiceSeccion]);
                return (
                  <button key={s.key} type="button" onClick={() => { if (puedeIr) setSeccionActiva(s.key); }} disabled={!puedeIr}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      esActual ? 'border-gray-900 text-gray-900' : puedeIr ? 'border-transparent text-gray-500 hover:text-gray-700 cursor-pointer' : 'border-transparent text-gray-300 cursor-not-allowed'
                    }`}>
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                      completada && !esActual ? 'bg-green-500 text-white' : esActual ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>{completada && !esActual ? '✓' : i + 1}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {seccionActiva === 'general' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clave</label>
                      <input type="text" value={formData.clave} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono" />
                      <p className="text-xs text-gray-400 mt-1">Se genera automáticamente</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de convocatoria *</label>
                      <select name="tipoConvocatoria" value={formData.tipoConvocatoria} onChange={handleInputChange} className={inputClase('tipoConvocatoria')}>
                        <option value="">Seleccione...</option>
                        <option value="Proyectos de innovación">Proyectos de innovación</option>
                        <option value="Investigación">Investigación</option>
                        <option value="Emprendimiento">Emprendimiento</option>
                        <option value="Desarrollo tecnológico">Desarrollo tecnológico</option>
                        <option value="Servicio social">Servicio social</option>
                      </select>
                      {campoError('tipoConvocatoria')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la convocatoria *</label>
                    <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} maxLength={150} className={inputClase('titulo')} placeholder="Ej: Convocatoria de Proyectos de Innovación 2026" />
                    <div className="flex justify-between">{campoError('titulo')}<span className="text-xs text-gray-400">{formData.titulo.length}/150</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3} maxLength={500} className={inputClase('descripcion')} placeholder="Descripción breve de la convocatoria..." />
                    <div className="flex justify-between">{campoError('descripcion')}<span className="text-xs text-gray-400">{formData.descripcion.length}/500</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                    <textarea name="objetivo" value={formData.objetivo} onChange={handleInputChange} rows={2} maxLength={500} className={inputClase('objetivo')} placeholder="Objetivo principal de la convocatoria..." />
                    <div className="flex justify-between">{campoError('objetivo')}<span className="text-xs text-gray-400">{formData.objetivo.length}/500</span></div>
                  </div>
                </>
              )}

              {seccionActiva === 'fechas' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-blue-700 font-medium">La fecha de publicación se registra automáticamente como la fecha de hoy.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de publicación</label>
                      <input type="date" value={formData.fechaPublicacion} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de apertura *</label>
                      <input type="date" name="fechaApertura" value={formData.fechaApertura} onChange={handleInputChange} min={formData.fechaPublicacion} className={inputClase('fechaApertura')} />
                      {campoError('fechaApertura')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite de registro</label>
                      <input type="date" name="fechaLimiteRegistro" value={formData.fechaLimiteRegistro} onChange={handleInputChange} min={formData.fechaApertura || formData.fechaPublicacion} className={inputClase('fechaLimiteRegistro')} />
                      {campoError('fechaLimiteRegistro')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de cierre</label>
                      <input type="date" name="fechaCierre" value={formData.fechaCierre} onChange={handleInputChange} min={formData.fechaLimiteRegistro || formData.fechaApertura} className={inputClase('fechaCierre')} />
                      {campoError('fechaCierre')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de evaluación</label>
                      <input type="date" name="fechaEvaluacion" value={formData.fechaEvaluacion} onChange={handleInputChange} min={formData.fechaCierre || formData.fechaLimiteRegistro} className={inputClase('fechaEvaluacion')} />
                      {campoError('fechaEvaluacion')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha publicación de resultados</label>
                      <input type="date" name="fechaPublicacionResultados" value={formData.fechaPublicacionResultados} onChange={handleInputChange} min={formData.fechaEvaluacion || formData.fechaCierre} className={inputClase('fechaPublicacionResultados')} />
                      {campoError('fechaPublicacionResultados')}
                    </div>
                  </div>
                </>
              )}

              {seccionActiva === 'config' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIAS_OPCIONES.map((cat) => (
                        <button key={cat} type="button" onClick={() => handleCategoriaToggle(cat)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            formData.categorias.includes(cat) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                          }`}>{cat}</button>
                      ))}
                    </div>
                    {formData.categorias.length === 0 && <p className="text-xs text-gray-400 mt-1">Opcional: seleccione al menos una categoría.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        {ESTADOS_OPCIONES.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Escala de evaluación *</label>
                      <select name="escalaEvaluacion" value={formData.escalaEvaluacion} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value={5}>1 - 5</option>
                        <option value={10}>1 - 10</option>
                        <option value={100}>1 - 100</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Máx. proyectos *</label>
                      <input type="number" name="numeroMaximoProyectos" value={formData.numeroMaximoProyectos} onChange={handleInputChange} min={1} max={500} className={inputClase('numeroMaximoProyectos')} />
                      {campoError('numeroMaximoProyectos')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Máx. integrantes *</label>
                      <input type="number" name="numeroMaximoIntegrantes" value={formData.numeroMaximoIntegrantes} onChange={handleInputChange} min={2} max={10} className={inputClase('numeroMaximoIntegrantes')} />
                      {campoError('numeroMaximoIntegrantes')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Evaluadores / proyecto *</label>
                      <input type="number" name="numeroEvaluadoresPorProyecto" value={formData.numeroEvaluadoresPorProyecto} onChange={handleInputChange} min={1} max={5} className={inputClase('numeroEvaluadoresPorProyecto')} />
                      {campoError('numeroEvaluadoresPorProyecto')}
                    </div>
                  </div>
                </>
              )}

              {seccionActiva === 'docs' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Adjunte los documentos oficiales de la convocatoria. Estos serán visibles para los participantes.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bases (PDF)</label>
                    {editandoId && archivosExistentes.bases && !archivos.bases && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                        <FileText size={14} className="text-green-600" />
                        <span className="text-sm text-green-700 flex-1 truncate">{archivosExistentes.bases.split('/').pop()}</span>
                        <a href={`${api.defaults.baseURL}/convocatorias/${editandoId}/archivos/bases`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800"><Download size={14} /></a>
                      </div>
                    )}
                    <input type="file" accept=".pdf" onChange={(e) => setArchivos({ ...archivos, bases: e.target.files[0] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium hover:file:bg-gray-200" />
                    {archivos.bases && <p className="text-xs text-green-600 mt-1">Nuevo archivo: {archivos.bases.name}</p>}
                    <p className="text-xs text-gray-400 mt-1">Formato PDF. Tamaño máximo: 10 MB.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Convocatoria PDF</label>
                    {editandoId && archivosExistentes.convocatoria && !archivos.convocatoria && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                        <FileText size={14} className="text-green-600" />
                        <span className="text-sm text-green-700 flex-1 truncate">{archivosExistentes.convocatoria.split('/').pop()}</span>
                        <a href={`${api.defaults.baseURL}/convocatorias/${editandoId}/archivos/convocatoria`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800"><Download size={14} /></a>
                      </div>
                    )}
                    <input type="file" accept=".pdf" onChange={(e) => setArchivos({ ...archivos, convocatoria: e.target.files[0] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium hover:file:bg-gray-200" />
                    {archivos.convocatoria && <p className="text-xs text-green-600 mt-1">Nuevo archivo: {archivos.convocatoria.name}</p>}
                    <p className="text-xs text-gray-400 mt-1">Formato PDF. Tamaño máximo: 10 MB.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formatos</label>
                    {editandoId && archivosExistentes.formatos && !archivos.formatos && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                        <FileText size={14} className="text-green-600" />
                        <span className="text-sm text-green-700 flex-1 truncate">{archivosExistentes.formatos.split('/').pop()}</span>
                        <a href={`${api.defaults.baseURL}/convocatorias/${editandoId}/archivos/formatos`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800"><Download size={14} /></a>
                      </div>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setArchivos({ ...archivos, formatos: e.target.files[0] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium hover:file:bg-gray-200" />
                    {archivos.formatos && <p className="text-xs text-green-600 mt-1">Nuevo archivo: {archivos.formatos.name}</p>}
                    <p className="text-xs text-gray-400 mt-1">PDF, Word o Excel.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between px-6 py-4 border-t border-gray-100">
              <div>
                {indiceSeccion > 0 && (
                  <button type="button" onClick={anteriorSeccion} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                {indiceSeccion < SECCIONES.length - 1 ? (
                  <button type="button" onClick={siguienteSeccion} disabled={!puedeAvanzar}
                    className={`flex items-center gap-1 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      puedeAvanzar ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>Siguiente <ChevronRight size={16} /></button>
                ) : (
                  <button type="submit" className="px-6 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    {editandoId ? 'Actualizar' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
