import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const CATEGORIAS = [
  'Tecnología',
  'Sostenibilidad',
  'Salud',
  'Educación',
  'Social',
  'Otro',
];

const PASOS = [
  { num: 1, label: 'General' },
  { num: 2, label: 'Detalles' },
  { num: 3, label: 'Documentos' },
  { num: 4, label: 'Confirmación' },
];

function Stepper({ pasoActual }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {PASOS.map((paso, index) => {
        const activo = pasoActual === paso.num;
        const completado = pasoActual > paso.num;

        return (
          <div key={paso.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  activo
                    ? 'bg-gray-900 text-white'
                    : completado
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-300'
                }`}
              >
                {completado ? <Check size={16} /> : paso.num}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  activo ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {paso.label}
              </span>
            </div>
            {index < PASOS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mt-[-20px] ${
                  completado ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PasoGeneral({ formulario, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título del Proyecto *
        </label>
        <input
          type="text"
          name="titulo"
          value={formulario.titulo}
          onChange={onChange}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="Ej: Sistema de detección de fraudes bancarios"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría *
        </label>
        <select
          name="categoria"
          value={formulario.categoria}
          onChange={onChange}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value="">Seleccione una categoría</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resumen *
        </label>
        <textarea
          name="resumen"
          value={formulario.resumen}
          onChange={onChange}
          required
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="Descripción detallada del proyecto..."
        />
      </div>
    </div>
  );
}

function PasoDetalles({ formulario, onChange, integrantes, onIntegrantesChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivo General *
        </label>
        <textarea
          name="objetivoGeneral"
          value={formulario.objetivoGeneral}
          onChange={onChange}
          required
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="Objetivo general del proyecto"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivos Específicos *
        </label>
        <textarea
          name="objetivosEspecificos"
          value={formulario.objetivosEspecificos}
          onChange={onChange}
          required
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="1. Primer objetivo específico&#10;2. Segundo objetivo específico&#10;3. Tercer objetivo específico"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Carrera *
          </label>
          <input
            type="text"
            name="carrera"
            value={formulario.carrera}
            onChange={onChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Ej: Ingeniería en Sistemas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Línea de Investigación *
          </label>
          <input
            type="text"
            name="lineaInvestigacion"
            value={formulario.lineaInvestigacion}
            onChange={onChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Ej: Inteligencia Artificial"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Integrantes del Equipo (IDs separados por coma)
        </label>
        <input
          type="text"
          value={integrantes}
          onChange={onIntegrantesChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="Ej: 2, 3, 5"
        />
        <p className="mt-1 text-sm text-gray-500">
          Ingrese los IDs de los integrantes separados por comas
        </p>
      </div>
    </div>
  );
}

function PasoDocumentos({ archivo, onArchivoChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Documento Inicial (Protocolo/Anteproyecto)
        </label>

        <label
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            archivo
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <UploadCloud
              size={40}
              className={archivo ? 'text-green-500' : 'text-gray-400'}
            />
            {archivo ? (
              <>
                <p className="text-sm font-medium text-green-700">
                  {archivo.name}
                </p>
                <p className="text-xs text-green-600">
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
                    Haz clic para subir
                  </span>{' '}
                  o arrastra un archivo
                </p>
                <p className="text-xs text-gray-500">Solo archivos PDF (máx. 20 MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={onArchivoChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

function PasoConfirmacion({ formulario, integrantes, archivo }) {
  const integrantes Lista = integrantes
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Revisa los datos antes de enviar
      </h3>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Título
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formulario.titulo || '-'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Categoría
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {formulario.categoria || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Carrera
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {formulario.carrera || '-'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Resumen
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formulario.resumen || '-'}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Objetivo General
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formulario.objetivoGeneral || '-'}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Objetivos Específicos
          </p>
          <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">
            {formulario.objetivosEspecificos || '-'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Línea de Investigación
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {formulario.lineaInvestigacion || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Integrantes
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {integrantesLista.length > 0
                ? `IDs: ${integrantesLista.join(', ')}`
                : 'Sin integrantes'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Documento
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {archivo ? archivo.name : 'No se adjuntó documento'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroProyecto() {
  const { user } = useAuth();
  const [pasoActual, setPasoActual] = useState(1);

  const [formulario, setFormulario] = useState({
    titulo: '',
    categoria: '',
    resumen: '',
    objetivoGeneral: '',
    objetivosEspecificos: '',
    carrera: '',
    lineaInvestigacion: '',
  });

  const [integrantes, setIntegrantes] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSiguiente = () => {
    if (pasoActual < 4) setPasoActual((prev) => prev + 1);
  };

  const handleAnterior = () => {
    if (pasoActual > 1) setPasoActual((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    try {
      const integrantesIds = integrantes
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      const payload = {
        convocatoriaId: 1,
        titulo: formulario.titulo,
        categoria: formulario.categoria,
        resumen: formulario.resumen,
        objetivoGeneral: formulario.objetivoGeneral,
        objetivosEspecificos: formulario.objetivosEspecificos,
        carrera: formulario.carrera,
        lineaInvestigacion: formulario.lineaInvestigacion,
        fechaInicio: new Date().toISOString(),
        integrantesIds,
      };

      const token = localStorage.getItem('token');
      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || 'Error al registrar el proyecto');
      }

      const data = await res.json();

      if (archivo && data.id) {
        const formData = new FormData();
        formData.append('proyectoId', data.id);
        formData.append('archivo', archivo);

        await fetch('/api/documentos/subir', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      setMensaje({ tipo: 'exito', texto: 'Proyecto registrado exitosamente.' });
      setFormulario({
        titulo: '',
        categoria: '',
        resumen: '',
        objetivoGeneral: '',
        objetivosEspecificos: '',
        carrera: '',
        lineaInvestigacion: '',
      });
      setIntegrantes('');
      setArchivo(null);
      setPasoActual(1);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 1:
        return <PasoGeneral formulario={formulario} onChange={handleChange} />;
      case 2:
        return (
          <PasoDetalles
            formulario={formulario}
            onChange={handleChange}
            integrantes={integrantes}
            onIntegrantesChange={(e) => setIntegrantes(e.target.value)}
          />
        );
      case 3:
        return (
          <PasoDocumentos
            archivo={archivo}
            onArchivoChange={(e) => setArchivo(e.target.files[0])}
          />
        );
      case 4:
        return (
          <PasoConfirmacion
            formulario={formulario}
            integrantes={integrantes}
            archivo={archivo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Registrar Nuevo Proyecto
      </h1>

      {mensaje && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            mensaje.tipo === 'exito'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Stepper pasoActual={pasoActual} />

        <div className="py-6">{renderPaso()}</div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {pasoActual > 1 && (
            <button
              type="button"
              onClick={handleAnterior}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          )}

          {pasoActual < 4 ? (
            <button
              type="button"
              onClick={handleSiguiente}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={enviando}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                enviando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {enviando ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                </>
              ) : (
                'Registrar Proyecto'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
