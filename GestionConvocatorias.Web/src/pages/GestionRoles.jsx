import { useState, useEffect } from 'react';
import { Search, ShieldCheck, X, Check } from 'lucide-react';
import api from '../services/api';

const TODOS_LOS_ROLES = ['Administrador', 'Coordinador', 'DocenteAsesor', 'Estudiante', 'Evaluador'];

const COLORES_ROL = {
  Administrador: 'bg-red-100 text-red-800',
  Coordinador: 'bg-blue-100 text-blue-800',
  DocenteAsesor: 'bg-purple-100 text-purple-800',
  Estudiante: 'bg-green-100 text-green-800',
  Evaluador: 'bg-yellow-100 text-yellow-800',
};

function RolBadge({ rol }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COLORES_ROL[rol] || 'bg-gray-100 text-gray-800'}`}>
      {rol}
    </span>
  );
}

export default function GestionRoles() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [rolesEditados, setRolesEditados] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/usuarios')
      .then((res) => setUsuarios(res.data))
      .catch(() => alert('Error al cargar los usuarios.'))
      .finally(() => setCargando(false));
  }, []);

  const abrirModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setRolesEditados([...usuario.roles]);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioSeleccionado(null);
    setRolesEditados([]);
  };

  const toggleRol = (rol) => {
    setRolesEditados((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]
    );
  };

  const guardarRoles = async () => {
    if (!usuarioSeleccionado || rolesEditados.length === 0) return;
    setGuardando(true);
    try {
      await api.put(`/usuarios/${usuarioSeleccionado.id}/roles`, { roles: rolesEditados });
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioSeleccionado.id
            ? { ...u, roles: [...rolesEditados], rol: rolesEditados.join(',') }
            : u
        )
      );
      cerrarModal();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar roles.');
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `${u.nombres} ${u.apellidos} ${u.correoElectronico}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    if (filtroRol === 'Todos') return coincideBusqueda;
    return coincideBusqueda && u.roles.includes(filtroRol);
  });

  const conteoRoles = TODOS_LOS_ROLES.map((rol) => ({
    rol,
    total: usuarios.filter((u) => u.roles.includes(rol)).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Roles</h1>
        <p className="text-sm text-gray-500 mt-1">Administra los roles asignados a cada usuario del sistema.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {conteoRoles.map(({ rol, total }) => (
          <div key={rol} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{rol}</p>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroRol('Todos')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroRol === 'Todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {TODOS_LOS_ROLES.map((rol) => (
            <button
              key={rol}
              onClick={() => setFiltroRol(rol)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroRol === rol ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {rol}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Usuario</th>
                  <th className="px-6 py-3 font-medium">Correo</th>
                  <th className="px-6 py-3 font-medium">Roles</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No se encontraron usuarios.</td></tr>
                ) : usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{u.nombres} {u.apellidos}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.correoElectronico}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((rol) => <RolBadge key={rol} rol={rol} />)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => abrirModal(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ShieldCheck size={14} /> Gestionar roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAbierto && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Asignar Roles</h2>
                <p className="text-sm text-gray-500">{usuarioSeleccionado.nombres} {usuarioSeleccionado.apellidos}</p>
              </div>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {TODOS_LOS_ROLES.map((rol) => (
                <label
                  key={rol}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    rolesEditados.includes(rol) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={rolesEditados.includes(rol)}
                    onChange={() => toggleRol(rol)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <RolBadge rol={rol} />
                  </div>
                </label>
              ))}
              {rolesEditados.length === 0 && (
                <p className="text-sm text-red-500">Debe seleccionar al menos un rol.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={cerrarModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={guardarRoles}
                disabled={guardando || rolesEditados.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
