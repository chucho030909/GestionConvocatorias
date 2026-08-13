import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recuperarContrasena } from '../services/api';
import { Mail } from 'lucide-react';

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const res = await recuperarContrasena(correo);
      if (res.exito) {
        setMensaje(res.mensaje);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.mensaje);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al enviar el correo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-3">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-gray-500 mt-2">
            Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo institucional
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="correo@uttt.edu.mx"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya recordaste tu contraseña?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
