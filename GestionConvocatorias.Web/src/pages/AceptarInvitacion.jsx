import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';

const GRADOS = ['Licenciatura', 'Maestría', 'Doctorado'];
const ANIOS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];

export default function AceptarInvitacion() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('validando');
  const [correo, setCorreo] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    gradoAcademico: '',
    profesion: '',
    especialidad: '',
    institucionProcedencia: '',
    cargoActual: '',
    anosExperiencia: '',
    lineasInvestigacion: '',
    areasEspecializacion: '',
    publicaciones: '',
    certificaciones: '',
  });

  const [errores, setErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const tok = searchParams.get('token');
    const corr = searchParams.get('correo');
    const err = searchParams.get('error');

    if (err) {
      setEstado('error');
      if (err === 'token_invalido') setError('El enlace de invitación no es válido.');
      else if (err === 'ya_aceptada') setError('Esta invitación ya fue aceptada anteriormente.');
      else if (err === 'token_expirado') setError('El enlace de invitación ha expirado.');
      else setError('Ocurrió un error al procesar la invitación.');
      return;
    }

    if (!tok) {
      setEstado('error');
      setError('No se proporcionó un token de invitación.');
      return;
    }

    setToken(tok);
    setCorreo(corr || '');
    setEstado('formulario');
  }, [searchParams]);

  const handle = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
    setErrores([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setEnviando(true);

    const errs = [];
    if (!form.nombres.trim()) errs.push('Los nombres son obligatorios.');
    if (!form.apellidos.trim()) errs.push('Los apellidos son obligatorios.');
    if (!form.password) errs.push('La contraseña es obligatoria.');
    if (form.password.length < 6) errs.push('La contraseña debe tener al menos 6 caracteres.');
    if (form.password !== form.confirmPassword) errs.push('Las contraseñas no coinciden.');
    if (errs.length) { setErrores(errs); setEnviando(false); return; }

    try {
      await api.post('/api/invitaciones/aceptar', {
        token,
        password: form.password,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim() || null,
        gradoAcademico: form.gradoAcademico || null,
        profesion: form.profesion.trim() || null,
        especialidad: form.especialidad.trim() || null,
        institucionProcedencia: form.institucionProcedencia.trim() || null,
        cargoActual: form.cargoActual.trim() || null,
        anosExperiencia: form.anosExperiencia ? parseInt(form.anosExperiencia) : null,
        lineasInvestigacion: form.lineasInvestigacion.trim() || null,
        areasEspecializacion: form.areasEspecializacion.trim() || null,
        publicaciones: form.publicaciones.trim() || null,
        certificaciones: form.certificaciones.trim() || null,
      });
      setEstado('exito');
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.errores?.join(', ') || 'Error al crear la cuenta.';
      setErrores([msg]);
    } finally {
      setEnviando(false);
    }
  };

  if (estado === 'validando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
    </div>
  );

  if (estado === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate('/login')} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition">Ir a Iniciar Sesión</button>
      </div>
    </div>
  );

  if (estado === 'exito') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta Creada</h2>
        <p className="text-gray-600 mb-6">Tu cuenta de evaluador fue creada exitosamente. Ya puedes iniciar sesión.</p>
        <button onClick={() => navigate('/login')} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition">Ir a Iniciar Sesión</button>
      </div>
    </div>
  );

  const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none";
  const label = "block text-xs font-medium text-gray-700 mb-1";
  const sectionTitle = "text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aceptar Invitación de Evaluador</h1>
          <p className="text-gray-500 mt-1">Completa tu perfil profesional para activar tu cuenta</p>
          {correo && <p className="text-sm text-gray-600 mt-2">Correo: <span className="font-medium">{correo}</span></p>}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {errores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {errores.map((e, i) => <p key={i} className="text-sm text-red-700">{e}</p>)}
            </div>
          )}

          <div>
            <h3 className={sectionTitle}>Credenciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Contraseña *</label><input type="password" className={input} value={form.password} onChange={e => handle('password', e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <div><label className={label}>Confirmar Contraseña *</label><input type="password" className={input} value={form.confirmPassword} onChange={e => handle('confirmPassword', e.target.value)} placeholder="Repite la contraseña" /></div>
            </div>
          </div>

          <div>
            <h3 className={sectionTitle}>Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Nombres *</label><input className={input} value={form.nombres} onChange={e => handle('nombres', e.target.value)} /></div>
              <div><label className={label}>Apellidos *</label><input className={input} value={form.apellidos} onChange={e => handle('apellidos', e.target.value)} /></div>
              <div><label className={label}>Teléfono</label><input className={input} value={form.telefono} onChange={e => handle('telefono', e.target.value)} /></div>
            </div>
          </div>

          <div>
            <h3 className={sectionTitle}>Información Profesional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Grado Académico</label>
                <select className={input} value={form.gradoAcademico} onChange={e => handle('gradoAcademico', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {GRADOS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label className={label}>Profesión</label><input className={input} value={form.profesion} onChange={e => handle('profesion', e.target.value)} placeholder="Ej: Ing. en Sistemas" /></div>
              <div><label className={label}>Especialidad</label><input className={input} value={form.especialidad} onChange={e => handle('especialidad', e.target.value)} placeholder="Ej: Inteligencia Artificial" /></div>
              <div><label className={label}>Institución de Procedencia</label><input className={input} value={form.institucionProcedencia} onChange={e => handle('institucionProcedencia', e.target.value)} placeholder="Ej: UTTT" /></div>
              <div><label className={label}>Cargo Actual</label><input className={input} value={form.cargoActual} onChange={e => handle('cargoActual', e.target.value)} placeholder="Ej: Docente" /></div>
              <div><label className={label}>Años de Experiencia</label>
                <select className={input} value={form.anosExperiencia} onChange={e => handle('anosExperiencia', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {ANIOS.map(a => <option key={a} value={a}>{a} {a === 1 ? 'año' : 'años'}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className={sectionTitle}>Investigación y Producción Académica</h3>
            <div className="space-y-4">
              <div><label className={label}>Líneas de Investigación</label><textarea className={input + ' h-16 resize-none'} value={form.lineasInvestigacion} onChange={e => handle('lineasInvestigacion', e.target.value)} placeholder="Una por línea" /></div>
              <div><label className={label}>Áreas de Especialización</label><textarea className={input + ' h-16 resize-none'} value={form.areasEspecializacion} onChange={e => handle('areasEspecializacion', e.target.value)} placeholder="Una por área" /></div>
              <div><label className={label}>Publicaciones</label><textarea className={input + ' h-16 resize-none'} value={form.publicaciones} onChange={e => handle('publicaciones', e.target.value)} placeholder="Una por publicación" /></div>
              <div><label className={label}>Certificaciones</label><textarea className={input + ' h-16 resize-none'} value={form.certificaciones} onChange={e => handle('certificaciones', e.target.value)} placeholder="Una por certificación" /></div>
            </div>
          </div>

          <button type="submit" disabled={enviando} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {enviando ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</> : 'Crear Cuenta de Evaluador'}
          </button>
        </form>
      </div>
    </div>
  );
}
