import { useState } from 'react';
import { X, FileText, Upload, UserPlus, Trash2, ExternalLink, Package } from 'lucide-react';
import api, { crearProyecto } from '../services/api';

const CATEGORIAS_POR_DEFECTO = [
  'Innovación', 'Tecnología', 'Salud', 'Medio ambiente',
  'Emprendimiento', 'Investigación', 'Desarrollo de software', 'Otra',
];

export default function CrearProyectoModal({ convocatoriaId, convocatoriaMaxIntegrantes, categorias, onClose, onCreado }) {
  const [titulo, setTitulo] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [propuestaPDF, setPropuestaPDF] = useState(null);
  const [codigoFuente, setCodigoFuente] = useState(null);
  const [emailsIntegrantes, setEmailsIntegrantes] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);

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
    if (!propuestaPDF) { setError('La propuesta PDF es obligatoria.'); return; }
    if (!codigoFuente) { setError('El código fuente (ZIP) es obligatorio.'); return; }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('convocatoriaId', convocatoriaId);
      formData.append('titulo', titulo.trim());
      formData.append('nombreEquipo', nombreEquipo.trim());
      formData.append('categoria', categoria);
      formData.append('propuestaPDF', propuestaPDF);
      formData.append('codigoFuente', codigoFuente);
      if (emailsIntegrantes.length > 0) {
        formData.append('integrantesEmails', emailsIntegrantes.join(','));
      }

      await crearProyecto(formData);
      onCreado();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear el proyecto.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Registrar Proyecto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Título del proyecto *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del proyecto"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Nombre del equipo *</label>
            <input
              type="text"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              maxLength={150}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del equipo"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Categoría *</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccione una categoría</option>
              {opcionesCategorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Propuesta PDF */}
          <div>
            <label className="text-sm font-medium text-gray-700">Propuesta (PDF) *</label>
            <p className="text-xs text-gray-400 mb-1">Documento con la propuesta completa del proyecto.</p>
            <label className="mt-1 flex items-center justify-center border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
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

          {/* Código Fuente */}
          <div>
            <label className="text-sm font-medium text-gray-700">Código Fuente *</label>
            <p className="text-xs text-gray-400 mb-2">Sube el código fuente del proyecto en formato ZIP.</p>

            <label className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
              {codigoFuente ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Package size={16} className="text-green-500" />
                  {codigoFuente.name} ({(codigoFuente.size / 1024 / 1024).toFixed(1)} MB)
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Upload size={16} />
                  Seleccionar archivo ZIP (máx. 50 MB)
                </div>
              )}
              <input type="file" accept=".zip" className="hidden" onChange={(e) => setCodigoFuente(e.target.files[0])} />
            </label>

            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
              <ExternalLink size={14} />
              <span>GitHub Integration próximamente: el sistema creará el repositorio automáticamente.</span>
            </div>
          </div>

          {/* Integrantes */}
          <div>
            <label className="text-sm font-medium text-gray-700">Integrantes del equipo</label>
            <p className="text-xs text-gray-400 mb-2">
              Tú (el creador) se agrega automáticamente. Agrega los correos de tus compañeros.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="correo@ejemplo.com"
              />
              <button
                type="button"
                onClick={agregarIntegrante}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
              >
                <UserPlus size={16} />
              </button>
            </div>
            {emailsIntegrantes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emailsIntegrantes.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {email}
                    <button
                      type="button"
                      onClick={() => eliminarIntegrante(email)}
                      className="text-gray-400 hover:text-red-500"
                    >
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

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={subiendo}
              className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {subiendo ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
