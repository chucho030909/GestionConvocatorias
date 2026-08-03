import { useState } from 'react';
import { Settings, User, Shield, Save, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'perfil', label: 'Mi Perfil', icon: User },
  { id: 'sistema', label: 'Configuración del Sistema', icon: Shield },
];

export default function Configuracion() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('perfil');

  return (
    <div className="min-h-full space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-500">Gestiona tu perfil y parámetros del sistema.</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tabActiva === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {tabActiva === 'perfil' && <PerfilTab user={user} />}
      {tabActiva === 'sistema' && <SistemaTab />}
    </div>
  );
}

function PerfilTab({ user }) {
  const [form, setForm] = useState({
    nombres: user?.name || '',
    email: user?.email || '',
    telefono: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleGuardar = (e) => {
    e.preventDefault();
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Información Personal</h2>
        <p className="text-sm text-gray-500 mt-1">Actualiza tu nombre, correo y datos de contacto.</p>
      </div>
      <form onSubmit={handleGuardar} className="p-6 space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            value={form.nombres}
            onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Mail size={14} /> Correo electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Phone size={14} /> Teléfono
          </label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="Opcional"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lock size={14} /> Cambiar contraseña
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {exito && (
            <span className="text-sm text-green-600 font-medium">Cambios guardados correctamente.</span>
          )}
        </div>
      </form>
    </div>
  );
}

function SistemaTab() {
  const [config, setConfig] = useState({
    jwtExpiracion: '60',
    smtpServidor: '',
    smtpPuerto: '587',
    smtpCorreo: '',
    maxProyectosPorConvocatoria: '50',
  });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleGuardar = (e) => {
    e.preventDefault();
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    }, 1000);
  };

  const handleChange = (campo, valor) => {
    setConfig({ ...config, [campo]: valor });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Parámetros del Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Configuración general de la plataforma ConvocaEval IA.</p>
      </div>
      <form onSubmit={handleGuardar} className="p-6 space-y-6 max-w-lg">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Autenticación</legend>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiración del token JWT (minutos)</label>
            <input
              type="number"
              value={config.jwtExpiracion}
              onChange={(e) => handleChange('jwtExpiracion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Correo Electrónico (SMTP)</legend>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servidor SMTP</label>
              <input
                type="text"
                value={config.smtpServidor}
                onChange={(e) => handleChange('smtpServidor', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                <input
                  type="number"
                  value={config.smtpPuerto}
                  onChange={(e) => handleChange('smtpPuerto', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo remitente</label>
                <input
                  type="email"
                  value={config.smtpCorreo}
                  onChange={(e) => handleChange('smtpCorreo', e.target.value)}
                  placeholder="notificaciones@uttt.edu.mx"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Convocatorias</legend>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de proyectos por convocatoria</label>
            <input
              type="number"
              value={config.maxProyectosPorConvocatoria}
              onChange={(e) => handleChange('maxProyectosPorConvocatoria', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {exito && (
            <span className="text-sm text-green-600 font-medium">Configuración guardada correctamente.</span>
          )}
        </div>
      </form>
    </div>
  );
}
