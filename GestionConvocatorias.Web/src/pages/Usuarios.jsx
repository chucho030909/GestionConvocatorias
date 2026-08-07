import { useEffect, useState } from 'react';
import { obtenerUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario } from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

const ROLES_DISPONIBLES = [
  ROLES.ADMINISTRADOR,
  ROLES.COORDINADOR,
  ROLES.DOCENTE_ASESOR,
  ROLES.ESTUDIANTE,
  ROLES.EVALUADOR,
];

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'crear' | { edicion: usuario } | null
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    correoElectronico: '',
    password: '',
    rol: ROLES.ESTUDIANTE,
    activo: true,
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCrear = () => {
    setForm({
      nombres: '',
      apellidos: '',
      correoElectronico: '',
      password: '',
      rol: ROLES.ESTUDIANTE,
      activo: true,
    });
    setModal('crear');
  };

  const abrirEditar = (u) => {
    setForm({
      nombres: u.nombres,
      apellidos: u.apellidos,
      correoElectronico: u.correoElectronico,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
    setModal({ edicion: u });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'crear') {
        await crearUsuario({
          Nombres: form.nombres,
          Apellidos: form.apellidos,
          CorreoElectronico: form.correoElectronico,
          Password: form.password,
          Rol: form.rol,
        });
      } else {
        const u = modal.edicion;
        await editarUsuario(u.id, {
          Nombres: form.nombres,
          Apellidos: form.apellidos,
          CorreoElectronico: form.correoElectronico,
          Rol: form.rol,
          Activo: form.activo,
        });
      }
      setModal(null);
      await cargar();
    } catch (err) {
      setError('No se pudo guardar el usuario.');
    }
  };

  const toggleEstado = async (u) => {
    try {
      await cambiarEstadoUsuario(u.id, !u.activo);
      await cargar();
    } catch (err) {
      alert('Error al cambiar el estado del usuario.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={abrirCrear}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900"
        >
          Nuevo Usuario
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Correo</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-t border-gray-200">
              <td className="px-4 py-3 font-medium">{`${u.nombres} ${u.apellidos}`}</td>
              <td className="px-4 py-3">{u.correoElectronico}</td>
              <td className="px-4 py-3">{u.rol}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-sm ${u.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => abrirEditar(u)}
                  className="bg-blue-800 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-900"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleEstado(u)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium text-white ${u.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {u.activo ? 'Inactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
          {!cargando && usuarios.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <form onSubmit={guardar} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold mb-2">
              {modal === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
            </h2>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Nombres</label>
              <input name="nombres" value={form.nombres} onChange={handleChange} required className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Apellidos</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange} required className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Correo electrónico</label>
              <input type="email" name="correoElectronico" value={form.correoElectronico} onChange={handleChange} required className="border p-2 rounded" />
            </div>
            {modal === 'crear' && (
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Contraseña</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required className="border p-2 rounded" />
              </div>
            )}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="border p-2 rounded">
                {ROLES_DISPONIBLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {modal !== 'crear' && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Activo
              </label>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModal(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400">
                Cancelar
              </button>
              <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
