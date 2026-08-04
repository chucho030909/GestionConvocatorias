import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import api from '../services/api';

function EstadoPill({ estado }) {
  const estilos = {
    Activa: 'bg-green-100 text-green-800',
    Cerrada: 'bg-red-100 text-red-800',
    'En registro': 'bg-blue-100 text-blue-800',
    Finalizada: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado}
    </span>
  );
}

export default function ConvocatoriasEstudiante() {
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [misRegistros, setMisRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtrar, setFiltrar] = useState('disponibles');
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/convocatorias/activas'),
      api.get('/convocatorias/mis-registros'),
    ])
      .then(([activasRes, registrosRes]) => {
        setConvocatorias(activasRes.data);
        setMisRegistros(registrosRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  const estaRegistrado = (convocatoriaId) =>
    misRegistros.some((r) => r.convocatoriaId === convocatoriaId);

  const handleRegistrar = async (convocatoriaId) => {
    setProcesando(convocatoriaId);
    try {
      await api.post(`/convocatorias/${convocatoriaId}/registrar`);
      const res = await api.get('/convocatorias/mis-registros');
      setMisRegistros(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.mensaje || 'Error al registrarse.');
    } finally {
      setProcesando(null);
    }
  };

  const handleCancelar = async (convocatoriaId) => {
    if (!window.confirm('¿Cancelar tu registro en esta convocatoria?')) return;
    setProcesando(convocatoriaId);
    try {
      await api.delete(`/convocatorias/${convocatoriaId}/cancelar-registro`);
      const res = await api.get('/convocatorias/mis-registros');
      setMisRegistros(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.mensaje || 'Error al cancelar.');
    } finally {
      setProcesando(null);
    }
  };

  const convocatoriasFiltradas = convocatorias.filter((c) => {
    const coincideBusqueda =
      c.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.clave?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.tipoConvocatoria?.toLowerCase().includes(busqueda.toLowerCase());
    if (filtrar === 'disponibles') return coincideBusqueda && !estaRegistrado(c.id);
    if (filtrar === 'registradas') return coincideBusqueda && estaRegistrado(c.id);
    return coincideBusqueda;
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Convocatorias Disponibles</h1>
        <p className="text-sm text-gray-500 mt-1">Explora las convocatorias activas y regístrate en las que desees participar.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, clave o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
          />
        </div>
        <div className="flex gap-2">
          {['disponibles', 'registradas', 'todas'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltrar(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtrar === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f === 'disponibles' ? 'Disponibles' : f === 'registradas' ? 'Mis registros' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : convocatoriasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-lg">
            {filtrar === 'registradas'
              ? 'No estás registrado en ninguna convocatoria.'
              : 'No hay convocatorias disponibles en este momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {convocatoriasFiltradas.map((c) => {
            const registrado = estaRegistrado(c.id);
            const procesandoActual = procesando === c.id;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${
                  registrado ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.clave}</span>
                      <EstadoPill estado={c.estado} />
                      {registrado && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} /> Registrado
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">{c.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.tipoConvocatoria}</p>
                  </div>
                </div>

                {c.descripcion && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.descripcion}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Apertura: {formatearFecha(c.fechaApertura)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Cierre: {formatearFecha(c.fechaCierre)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/convocatorias/${c.id}`)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ver Detalle
                  </button>
                  {registrado ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelar(c.id)}
                        disabled={procesandoActual}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {procesandoActual ? 'Cancelando...' : 'Cancelar registro'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegistrar(c.id)}
                      disabled={procesandoActual}
                      className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {procesandoActual ? 'Registrando...' : 'Registrarse'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
