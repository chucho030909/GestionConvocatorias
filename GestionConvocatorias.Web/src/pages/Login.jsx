import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const response = await api.post('/auth/login', {
        CorreoElectronico: correo,
        Password: password,
      });
      const { token } = response.data.datos;
      login(token);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="bg-gray-50 flex flex-col items-center justify-center text-center p-12 relative">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold mb-6">
          LOGO
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ConvocaEval <span className="text-blue-600">IA</span>
        </h1>

        <p className="text-xl font-medium text-gray-700 mb-2">
          Sistema de Evaluación de Proyectos
        </p>

        <p className="text-gray-500 max-w-sm">
          Plataforma inteligente para la gestión y evaluación de proyectos
          basados en convocatorias
        </p>

        <p className="absolute bottom-6 text-xs text-gray-400">
          © 2024 ConvocaEval IA - Todos los derechos reservados
        </p>
      </div>

      <div className="bg-white flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 text-center">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="correo@uttt.edu.mx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>

              <a
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gray-900 text-white rounded-lg py-3 mt-6 font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a
              href="#"
              className="font-medium text-gray-900 hover:underline"
            >
              Registrarse
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
