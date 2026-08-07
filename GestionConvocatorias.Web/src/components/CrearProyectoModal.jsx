import { useState } from 'react';
import { X, FileText, Upload, UserPlus, Trash2, ExternalLink } from 'lucide-react';
import api, { crearProyecto, crearRepositorio } from '../services/api';

const GithubIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const CATEGORIAS_POR_DEFECTO = [
  'Innovación', 'Tecnología', 'Salud', 'Medio ambiente',
  'Emprendimiento', 'Investigación', 'Desarrollo de software', 'Otra',
];

const MODALIDADES = ['Investigación', 'Desarrollo', 'Emprendimiento', 'Innovación', 'Otra'];

const AREAS_CONOCIMIENTO = [
  'Ingeniería en Sistemas', 'Ingeniería en Software', 'Ciencias de la Computación',
  'Tecnologías de la Información', 'Ingeniería Electrónica', 'Ingeniería Mecánica',
  'Administración', 'Economía', 'Derecho', 'Medicina', 'Biología', 'Química',
  'Física', 'Matemáticas', 'Educación', 'Psicología', 'Sociología', 'Otra',
];

export default function CrearProyectoModal({ convocatoriaId, convocatoriaMaxIntegrantes, categorias, onClose, onCreado }) {
  const [titulo, setTitulo] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [areaConocimiento, setAreaConocimiento] = useState('');
  const [lineaInvestigacion, setLineaInvestigacion] = useState('');
  const [modalidad, setModalidad] = useState('');
  const [problema, setProblema] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [objetivoGeneral, setObjetivoGeneral] = useState('');
  const [objetivosEspecificos, setObjetivosEspecificos] = useState('');
  const [resumen, setResumen] = useState('');
  const [propuestaPDF, setPropuestaPDF] = useState(null);
  const [emailsIntegrantes, setEmailsIntegrantes] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [proyectoCreado, setProyectoCreado] = useState(null);
  const [creandoRepo, setCreandoRepo] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const opcionesCategorias = categorias && categorias !== '[]'
    ? JSON.parse(categorias)
    : CATEGORIAS_POR_DEFECTO;

  const agregarIntegrante = () => {
    const email = emailInput.trim();
    if (!email) return;

    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (emailsIntegrantes.includes(email)) {
      setError('Este correo ya fue agregado.');
      return;
    }

    if (emailsIntegrantes.length >= convocatoriaMaxIntegrantes - 1) {
      setError(`Máximo ${convocatoriaMaxIntegrantes} integrantes por proyecto.`);
      return;
    }

    setEmailsIntegrantes([...emailsIntegrantes, email]);
    setEmailInput('');
    setError('');
  };

  const eliminarIntegrante = (email) => {
    setEmailsIntegrantes(emailsIntegrantes.filter(e => e !== email));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarIntegrante();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) { setError('El título es obligatorio.'); return; }
    if (!nombreEquipo.trim()) { setError('El nombre del equipo es obligatorio.'); return; }
    if (!categoria) { setError('Seleccione una categoría.'); return; }
    if (!areaConocimiento) { setError('Seleccione un área de conocimiento.'); return; }
    if (!modalidad) { setError('Seleccione una modalidad.'); return; }
    if (!problema.trim()) { setError('El problema es obligatorio.'); return; }
    if (!justificacion.trim()) { setError('La justificación es obligatoria.'); return; }
    if (!objetivoGeneral.trim()) { setError('El objetivo general es obligatorio.'); return; }
    if (!resumen.trim()) { setError('El resumen es obligatorio.'); return; }
    if (!propuestaPDF) { setError('La propuesta PDF es obligatoria.'); return; }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('convocatoriaId', convocatoriaId);
      formData.append('titulo', titulo.trim());
      formData.append('nombreEquipo', nombreEquipo.trim());
      formData.append('categoria', categoria);
      formData.append('areaConocimiento', areaConocimiento);
      formData.append('lineaInvestigacion', lineaInvestigacion.trim());
      formData.append('modalidad', modalidad);
      formData.append('problema', problema.trim());
      formData.append('justificacion', justificacion.trim());
      formData.append('objetivoGeneral', objetivoGeneral.trim());
      formData.append('objetivosEspecificos', objetivosEspecificos.trim());
      formData.append('resumen', resumen.trim());
      formData.append('propuestaPDF', propuestaPDF);
      if (emailsIntegrantes.length > 0) {
        formData.append('integrantesEmails', emailsIntegrantes.join(','));
      }

      const resultado = await crearProyecto(formData);
      setProyectoCreado(resultado);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear el proyecto.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleCrearRepositorio = async () => {
    if (!proyectoCreado) return;
    setCreandoRepo(true);
    setError('');
    try {
      const resultado = await crearRepositorio(proyectoCreado.id);
      setGithubUrl(resultado.githubUrl);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear el repositorio.');
    } finally {
      setCreandoRepo(false);
    }
  };

  const handleFinalizar = () => {
    onCreado();
  };

  const inputClass = "mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none";
  const labelClass = "block text-sm font-medium text-gray-700";
  const required = <span className="text-red-500">*</span>;

  if (proyectoCreado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Proyecto Creado</h2>
            <p className="text-gray-600 mb-2">Folio: <span className="font-mono font-bold">{proyectoCreado.folio}</span></p>
            <p className="text-gray-600 mb-6">{proyectoCreado.titulo}</p>

            {!githubUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Ahora crea el repositorio en GitHub para tu proyecto:</p>
                <button
                  onClick={handleCrearRepositorio}
                  disabled={creandoRepo}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  <GithubIcon size={20} />
                  {creandoRepo ? 'Creando repositorio...' : 'Crear Repositorio en GitHub'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">Repositorio creado exitosamente</p>
                </div>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink size={16} />
                  Abrir repositorio en GitHub
                </a>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200 mt-4">
                {error}
              </div>
            )}

            <button
              onClick={handleFinalizar}
              className="w-full mt-6 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Registrar Proyecto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Información General</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nombre del proyecto {required}</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200}
                  className={inputClass} placeholder="Nombre del proyecto" />
              </div>

              <div>
                <label className={labelClass}>Nombre del equipo {required}</label>
                <input type="text" value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} maxLength={150}
                  className={inputClass} placeholder="Nombre del equipo" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Categoría {required}</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
                    <option value="">Seleccione</option>
                    {opcionesCategorias.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Área del conocimiento {required}</label>
                  <select value={areaConocimiento} onChange={(e) => setAreaConocimiento(e.target.value)} className={inputClass}>
                    <option value="">Seleccione</option>
                    {AREAS_CONOCIMIENTO.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Modalidad {required}</label>
                  <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={inputClass}>
                    <option value="">Seleccione</option>
                    {MODALIDADES.map((mod) => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Línea de investigación</label>
                  <input type="text" value={lineaInvestigacion} onChange={(e) => setLineaInvestigacion(e.target.value)}
                    className={inputClass} placeholder="Ej: Inteligencia Artificial" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Resumen y Desarrollo</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Problema {required}</label>
                <textarea value={problema} onChange={(e) => setProblema(e.target.value)} rows={3}
                  className={inputClass + " resize-none"} placeholder="Describa el problema que resuelve el proyecto" />
              </div>
              <div>
                <label className={labelClass}>Justificación {required}</label>
                <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={3}
                  className={inputClass + " resize-none"} placeholder="¿Por qué es importante este proyecto?" />
              </div>
              <div>
                <label className={labelClass}>Objetivo general {required}</label>
                <textarea value={objetivoGeneral} onChange={(e) => setObjetivoGeneral(e.target.value)} rows={2}
                  className={inputClass + " resize-none"} placeholder="Objetivo principal del proyecto" />
              </div>
              <div>
                <label className={labelClass}>Objetivos específicos</label>
                <textarea value={objetivosEspecificos} onChange={(e) => setObjetivosEspecificos(e.target.value)} rows={3}
                  className={inputClass + " resize-none"} placeholder="Uno por línea" />
              </div>
              <div>
                <label className={labelClass}>Resumen ejecutivo {required}</label>
                <textarea value={resumen} onChange={(e) => setResumen(e.target.value)} rows={4}
                  className={inputClass + " resize-none"} placeholder="Resumen del proyecto incluyendo metodología, alcances, limitaciones, presupuestos e impactos" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Equipo de Trabajo</h3>
            <div>
              <label className={labelClass}>Integrantes del equipo</label>
              <p className="text-xs text-gray-400 mb-2">
                Tú (el creador) se agrega automáticamente. Agrega los correos de tus compañeros.
              </p>
              <div className="flex gap-2">
                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleKeyDown}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder="correo@ejemplo.com" />
                <button type="button" onClick={agregarIntegrante}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
                  <UserPlus size={16} />
                </button>
              </div>
              {emailsIntegrantes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailsIntegrantes.map((email) => (
                    <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      {email}
                      <button type="button" onClick={() => eliminarIntegrante(email)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {emailsIntegrantes.length + 1}/{convocatoriaMaxIntegrantes} integrantes
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Documentos</h3>
            <div>
              <label className={labelClass}>Documento del proyecto (PDF) {required}</label>
              <p className="text-xs text-gray-400 mb-1">Metodología, alcances, limitaciones, presupuestos e impactos.</p>
              <label className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                {propuestaPDF ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText size={16} className="text-green-500" />
                    {propuestaPDF.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Upload size={16} />
                    Seleccionar archivo PDF
                  </div>
                )}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setPropuestaPDF(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GithubIcon size={16} />
              <span>El repositorio en GitHub se creará automáticamente después de registrar el proyecto.</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={subiendo}
              className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {subiendo ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
