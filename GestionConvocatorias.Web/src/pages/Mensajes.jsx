import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Search, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function Mensajes() {
  const { user } = useAuth();
  const [contactos, setContactos] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [showNuevoChat, setShowNuevoChat] = useState(false);
  const mensajesRef = useRef(null);

  useEffect(() => {
    cargarContactos();
    if (user?.roles?.some(r => ['Administrador', 'Coordinador'].includes(r))) {
      api.get('/usuarios').then((res) => {
        setTodosUsuarios(res.data.filter(u => u.id !== user.id && u.activo));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (contactoSeleccionado) {
      cargarMensajes(contactoSeleccionado.usuarioId);
    }
  }, [contactoSeleccionado]);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarContactos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/mensajes/contactos');
      setContactos(res.data);
    } catch (err) {
      alert('Error al cargar los contactos.');
    } finally {
      setCargando(false);
    }
  };

  const cargarMensajes = async (usuarioId) => {
    try {
      setCargandoMensajes(true);
      const res = await api.get(`/mensajes/conversacion/${usuarioId}`);
      setMensajes(res.data);
    } catch (err) {
      alert('Error al cargar los mensajes.');
    } finally {
      setCargandoMensajes(false);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;

    try {
      await api.post('/mensajes/enviar', {
        receptorId: contactoSeleccionado.usuarioId,
        contenido: nuevoMensaje.trim(),
      });
      setNuevoMensaje('');
      cargarMensajes(contactoSeleccionado.usuarioId);
      cargarContactos();
    } catch (err) {
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    }
  };

  const iniciarChat = (usuario) => {
    setContactoSeleccionado({
      usuarioId: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
    });
    setShowNuevoChat(false);
    setMensajes([]);
  };

  const contactosFiltrados = contactos.filter(c =>
    `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const usuariosFiltrados = todosUsuarios.filter(u =>
    `${u.nombres} ${u.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearHora = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Panel lateral - contactos */}
      <div className={`w-80 border-r border-gray-100 flex flex-col ${contactoSeleccionado ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Mensajes</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {user?.roles?.some(r => ['Administrador', 'Coordinador'].includes(r)) && (
            <button
              onClick={() => setShowNuevoChat(true)}
              className="mt-3 w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Nuevo chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            </div>
          ) : contactosFiltrados.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No hay conversaciones aún.
            </div>
          ) : (
            contactosFiltrados.map((c) => (
              <button
                key={c.usuarioId}
                onClick={() => setContactoSeleccionado(c)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  contactoSeleccionado?.usuarioId === c.usuarioId ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {c.nombres} {c.apellidos}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">
                      {c.ultimoMensaje}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatearHora(c.fechaUltimoMensaje)}</p>
                    {c.mensajesNoLeidos > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gray-900 rounded-full mt-1">
                        {c.mensajesNoLeidos}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Panel de chat */}
      <div className={`flex-1 flex flex-col ${contactoSeleccionado ? 'flex' : 'hidden md:flex'}`}>
        {!contactoSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Selecciona una conversación para empezar</p>
          </div>
        ) : (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setContactoSeleccionado(null)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="font-medium text-gray-800">
                  {contactoSeleccionado.nombres} {contactoSeleccionado.apellidos}
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={mensajesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {cargandoMensajes ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              ) : mensajes.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  No hay mensajes aún. ¡Empieza la conversación!
                </div>
              ) : (
                mensajes.map((m) => {
                  const esMio = m.emisorId === user.id;
                  return (
                    <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          esMio
                            ? 'bg-gray-900 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{m.contenido}</p>
                        <p className={`text-xs mt-1 ${esMio ? 'text-gray-300' : 'text-gray-500'}`}>
                          {formatearHora(m.fechaEnvio)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input de envío */}
            <form onSubmit={enviarMensaje} className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="submit"
                  disabled={!nuevoMensaje.trim()}
                  className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Modal: Nuevo chat */}
      {showNuevoChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo chat</h2>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {usuariosFiltrados.map((u) => (
                <button
                  key={u.id}
                  onClick={() => iniciarChat(u)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <p className="font-medium text-gray-800 text-sm">{u.nombres} {u.apellidos}</p>
                  <p className="text-xs text-gray-500">{u.correoElectronico}</p>
                </button>
              ))}
              {usuariosFiltrados.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No se encontraron usuarios.</p>
              )}
            </div>
            <button
              onClick={() => { setShowNuevoChat(false); setBusqueda(''); }}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
