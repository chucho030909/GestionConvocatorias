import { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import api from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

function EstadoPill({ estado }) {
  const estilos = {
    Activa: 'bg-green-100 text-green-800',
    Finalizada: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        estilos[estado] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {estado}
    </span>
  );
}

function BotonAcciones({ convocatoria, onEditar, onEliminar }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
            <button
              onClick={() => {
                onEditar(convocatoria);
                setAbierto(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Editar
            </button>
            <button
              onClick={() => {
                onEliminar(convocatoria.id);
                setAbierto(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Convocatorias() {
  const { user } = useAuth();
  const [convocatorias, setConvocatorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaApertura: '',
    fechaCierre: '',
    estado: 'Activa',
  });

  const puedeEditar =
    user?.role === ROLES.ADMINISTRADOR || user?.role === ROLES.COORDINADOR;

  useEffect(() => {
    api
      .get('/convocatorias')
      .then((res) => setConvocatorias(res.data))
      .catch((err) => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/convocatorias', {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fechaApertura: new Date(formData.fechaApertura).toISOString(),
        fechaCierre: new Date(formData.fechaCierre).toISOString(),
        estado: 'Activa',
      });
      setIsModalOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        fechaApertura: '',
        fechaCierre: '',
        estado: 'Activa',
      });
      const res = await api.get('/convocatorias');
      setConvocatorias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta convocatoria?')) return;
    try {
      await api.delete(`/convocatorias/${id}`);
      setConvocatorias((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const convocatoriasFiltradas = convocatorias.filter((c) =>
    c.titulo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Convocatorias</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar convocatoria..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {puedeEditar && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Nueva convocatoria
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="px-6 py-3 font-medium">Categorías</th>
                  <th className="px-6 py-3 font-medium">Inicio</th>
                  <th className="px-6 py-3 font-medium">Fin</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {convocatoriasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No se encontraron convocatorias.
                    </td>
                  </tr>
                ) : (
                  convocatoriasFiltradas.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{c.titulo}</p>
                        {c.descripcion && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {c.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {c.categorias || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(c.fechaApertura)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(c.fechaCierre)}
                      </td>
                      <td className="px-6 py-4">
                        <EstadoPill estado={c.estado} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {puedeEditar && (
                          <BotonAcciones
                            convocatoria={c}
                            onEditar={(conv) => {
                              setFormData({
                                titulo: conv.titulo,
                                descripcion: conv.descripcion || '',
                                fechaApertura: conv.fechaApertura?.split('T')[0] || '',
                                fechaCierre: conv.fechaCierre?.split('T')[0] || '',
                                estado: conv.estado || 'Activa',
                              });
                              setIsModalOpen(true);
                            }}
                            onEliminar={handleEliminar}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Nueva Convocatoria
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título de la convocatoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción de la convocatoria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de apertura
                  </label>
                  <input
                    type="date"
                    name="fechaApertura"
                    value={formData.fechaApertura}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de cierre
                  </label>
                  <input
                    type="date"
                    name="fechaCierre"
                    value={formData.fechaCierre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Activa">Activa</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
