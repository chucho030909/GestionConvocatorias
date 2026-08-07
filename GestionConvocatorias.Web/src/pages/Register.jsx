import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrarEstudiante } from '../services/api';
import api from '../services/api';
import { Eye, EyeOff, Upload, GraduationCap, BookOpen } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState('');

  if (!rolSeleccionado) {
    return <SeleccionarRol onSelect={setRolSeleccionado} />;
  }

  if (rolSeleccionado === 'docente') {
    return <RegistroDocente onBack={() => setRolSeleccionado(null)} />;
  }

  return <RegistroAlumno onBack={() => setRolSeleccionado(null)} />;
}

function SeleccionarRol({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ConvocaEval <span className="text-blue-600">IA</span>
        </h1>
        <p className="text-gray-500 mb-8">¿Cómo deseas registrarte?</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('docente')}
            className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
              <BookOpen size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Docente</h3>
            <p className="text-sm text-gray-500 mt-1">Asesor o evaluador de proyectos</p>
          </button>

          <button
            onClick={() => onSelect('alumno')}
            className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition group"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
              <GraduationCap size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Alumno</h3>
            <p className="text-sm text-gray-500 mt-1">Estudiante participante</p>
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegistroDocente({ onBack }) {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    correo: '', password: '', confirmPassword: '',
    nombres: '', apellidos: '', telefono: '',
    gradoAcademico: '', profesion: '', especialidad: '',
    institucionProcedencia: '', cargoActual: '',
    anosExperiencia: '', lineasInvestigacion: '', areasEspecializacion: '',
    publicaciones: '', certificaciones: '',
  });

  const [archivos, setArchivos] = useState({ cv: null, identificacion: null, cartaConfidencialidad: null });
  const inputRef = { cv: useRef(null), identificacion: useRef(null), cartaConfidencialidad: useRef(null) };
  const abrirSelector = (key) => inputRef[key].current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('CorreoElectronico', form.correo);
      formData.append('Password', form.password);
      formData.append('Nombres', form.nombres);
      formData.append('Apellidos', form.apellidos);
      formData.append('Telefono', form.telefono);
      formData.append('GradoAcademico', form.gradoAcademico);
      formData.append('Profesion', form.profesion);
      formData.append('Especialidad', form.especialidad);
      formData.append('InstitucionProcedencia', form.institucionProcedencia);
      formData.append('CargoActual', form.cargoActual);
      formData.append('AnosExperiencia', form.anosExperiencia);
      formData.append('LineasInvestigacion', form.lineasInvestigacion);
      formData.append('AreasEspecializacion', form.areasEspecializacion);
      formData.append('Publicaciones', form.publicaciones);
      formData.append('Certificaciones', form.certificaciones);
      if (archivos.cv) formData.append('cvPDF', archivos.cv);
      if (archivos.identificacion) formData.append('identificacionPDF', archivos.identificacion);
      if (archivos.cartaConfidencialidad) formData.append('cartaConfidencialidadPDF', archivos.cartaConfidencialidad);

      await api.post('/auth/registrar-docente', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExitoso('Docente registrado exitosamente.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar.');
    } finally {
      setCargando(false);
    }
  };

  const renderArchivo = (key, label, obligatorio = false) => (
    <div className="border border-gray-300 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50">
      <span className="text-sm text-gray-600">{label} {obligatorio && <span className="text-red-500">*</span>}</span>
      <input type="file" accept="application/pdf" ref={inputRef[key]} onChange={(e) => setArchivos({ ...archivos, [key]: e.target.files[0] })} className="hidden" />
      <button type="button" onClick={() => abrirSelector(key)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
        <Upload size={16} />
        {archivos[key] ? archivos[key].name : 'Seleccionar PDF'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Volver</button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Docente</h1>
          <p className="text-sm text-gray-500 mt-1">Información personal, profesional y académica</p>
        </div>

        {exitoso && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">{exitoso}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Credenciales */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Credenciales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo institucional *</label>
                <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="correo@uttt.edu.mx" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Min 6 caracteres" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Repetir contraseña" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>}
              </div>
            </div>
          </div>

          {/* Datos personales */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Datos personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s) *</label><input type="text" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label><input type="text" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
          </div>

          {/* Información profesional */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Información profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grado académico</label>
                <select value={form.gradoAcademico} onChange={(e) => setForm({ ...form, gradoAcademico: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccionar</option>
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                  <option value="Postdoctorado">Postdoctorado</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label><input type="text" value={form.profesion} onChange={(e) => setForm({ ...form, profesion: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ingeniero, Licenciado, etc." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label><input type="text" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Institución de procedencia</label><input type="text" value={form.institucionProcedencia} onChange={(e) => setForm({ ...form, institucionProcedencia: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Cargo actual</label><input type="text" value={form.cargoActual} onChange={(e) => setForm({ ...form, cargoActual: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label><input type="number" min="0" value={form.anosExperiencia} onChange={(e) => setForm({ ...form, anosExperiencia: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
          </div>

          {/* Investigación */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Experiencia e investigación</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Líneas de investigación</label><textarea value={form.lineasInvestigacion} onChange={(e) => setForm({ ...form, lineasInvestigacion: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Una por línea" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Áreas de especialización</label><textarea value={form.areasEspecializacion} onChange={(e) => setForm({ ...form, areasEspecializacion: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Publicaciones</label><textarea value={form.publicaciones} onChange={(e) => setForm({ ...form, publicaciones: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Artículos, libros, conferencias..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Certificaciones</label><textarea value={form.certificaciones} onChange={(e) => setForm({ ...form, certificaciones: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} /></div>
            </div>
          </div>

          {/* Documentos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Documentación</h2>
            <div className="space-y-3">
              {renderArchivo('cv', 'Curriculum Vitae', true)}
              {renderArchivo('identificacion', 'Identificación oficial (INE)', true)}
              {renderArchivo('cartaConfidencialidad', 'Carta de confidencialidad', true)}
            </div>
          </div>

          <button type="submit" disabled={cargando} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-60">
            {cargando ? 'Registrando...' : 'Registrarse como Docente'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegistroAlumno({ onBack }) {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState('');

  const [credenciales, setCredenciales] = useState({ correo: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [personales, setPersonales] = useState({
    matricula: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', fechaNacimiento: '', correoPersonal: '', telefonoCelular: '',
  });

  const [academicos, setAcademicos] = useState({
    universidad: '', programaEducativo: '', cuatrimestre: '', grupo: '', promedioGeneral: '', modalidad: '',
  });

  const [archivos, setArchivos] = useState({ identificacion: null, constancia: null, cartaCompromiso: null });
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const inputRef = {
    identificacion: useRef(null), constancia: useRef(null), cartaCompromiso: useRef(null),
  };

  const abrirSelector = (key) => inputRef[key].current?.click();
  const passwordMatch = credenciales.password === credenciales.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwordMatch) { setError('Las contraseñas no coinciden.'); return; }
    if (credenciales.password.length < 6 || !/[A-Za-z]/.test(credenciales.password) || !/\d/.test(credenciales.password)) {
      setError('La contraseña debe tener al menos 6 caracteres, incluir una letra y un número.'); return;
    }
    if (!aceptaPrivacidad) { setError('Debes aceptar el aviso de privacidad.'); return; }
    if (!archivos.identificacion || !archivos.constancia || !archivos.cartaCompromiso) {
      setError('Todos los archivos son obligatorios.'); return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('CorreoElectronico', credenciales.correo);
      formData.append('Password', credenciales.password);
      formData.append('Matricula', personales.matricula);
      formData.append('Nombres', personales.nombres);
      formData.append('ApellidoPaterno', personales.apellidoPaterno);
      formData.append('ApellidoMaterno', personales.apellidoMaterno);
      formData.append('FechaNacimiento', personales.fechaNacimiento ? new Date(personales.fechaNacimiento).toISOString() : '');
      formData.append('CorreoPersonal', personales.correoPersonal);
      formData.append('TelefonoCelular', personales.telefonoCelular);
      formData.append('Universidad', academicos.universidad);
      formData.append('ProgramaEducativo', academicos.programaEducativo);
      formData.append('Cuatrimestre', academicos.cuatrimestre);
      formData.append('Grupo', academicos.grupo);
      formData.append('PromedioGeneral', academicos.promedioGeneral);
      formData.append('Modalidad', academicos.modalidad);
      formData.append('AceptaPrivacidad', String(aceptaPrivacidad));
      formData.append('identificacionPDF', archivos.identificacion);
      formData.append('constanciaPDF', archivos.constancia);
      formData.append('cartaCompromisoPDF', archivos.cartaCompromiso);

      const res = await registrarEstudiante(formData);
      if (res.exito) {
        setExitoso(res.mensaje);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.mensaje);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar.');
    } finally {
      setCargando(false);
    }
  };

  const renderArchivo = (key, label) => (
    <div className="border border-gray-300 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <input type="file" accept="application/pdf" ref={inputRef[key]} onChange={(e) => setArchivos({ ...archivos, [key]: e.target.files[0] })} className="hidden" />
      <button type="button" onClick={() => abrirSelector(key)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
        <Upload size={16} />
        {archivos[key] ? archivos[key].name : 'Seleccionar archivo'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Volver</button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de <span className="text-green-600">Alumno</span></h1>
        </div>

        {exitoso && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">{exitoso}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Credenciales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo institucional</label>
                <input type="email" value={credenciales.correo} onChange={(e) => setCredenciales({ ...credenciales, correo: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" placeholder="correo@uttt.edu.mx" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={credenciales.password} onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-green-500 outline-none" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={credenciales.confirmPassword} onChange={(e) => setCredenciales({ ...credenciales, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-green-500 outline-none" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!passwordMatch && credenciales.confirmPassword && <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Datos personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label><input type="text" value={personales.matricula} onChange={(e) => setPersonales({ ...personales, matricula: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label><input type="text" value={personales.nombres} onChange={(e) => setPersonales({ ...personales, nombres: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido paterno</label><input type="text" value={personales.apellidoPaterno} onChange={(e) => setPersonales({ ...personales, apellidoPaterno: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido materno</label><input type="text" value={personales.apellidoMaterno} onChange={(e) => setPersonales({ ...personales, apellidoMaterno: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label><input type="date" value={personales.fechaNacimiento} onChange={(e) => setPersonales({ ...personales, fechaNacimiento: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Correo personal</label><input type="email" value={personales.correoPersonal} onChange={(e) => setPersonales({ ...personales, correoPersonal: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono celular</label><input type="text" value={personales.telefonoCelular} onChange={(e) => setPersonales({ ...personales, telefonoCelular: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" /></div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Datos académicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Universidad</label><input type="text" value={academicos.universidad} onChange={(e) => setAcademicos({ ...academicos, universidad: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Programa educativo</label><input type="text" value={academicos.programaEducativo} onChange={(e) => setAcademicos({ ...academicos, programaEducativo: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuatrimestre</label>
                <select value={academicos.cuatrimestre} onChange={(e) => setAcademicos({ ...academicos, cuatrimestre: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                  <option value="">Seleccionar</option>
                  {[1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n}er Cuatrimestre</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label><input type="text" value={academicos.grupo} onChange={(e) => setAcademicos({ ...academicos, grupo: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promedio general</label>
                <select value={academicos.promedioGeneral} onChange={(e) => setAcademicos({ ...academicos, promedioGeneral: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                  <option value="">Seleccionar</option>
                  {[...Array(21)].map((_, i) => { const val = (8.0 + i * 0.1).toFixed(1); return <option key={val} value={val}>{val}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                <select value={academicos.modalidad} onChange={(e) => setAcademicos({ ...academicos, modalidad: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                  <option value="">Seleccionar</option>
                  <option value="TSU">TSU</option>
                  <option value="Ingeniería">Ingeniería</option>
                  <option value="Posgrado">Posgrado</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Archivos y validaciones</h2>
            <div className="space-y-3">
              {renderArchivo('identificacion', 'Identificación oficial (INE)')}
              {renderArchivo('constancia', 'Constancia de estudios')}
              {renderArchivo('cartaCompromiso', 'Carta compromiso')}
            </div>
            <div className="flex items-start mt-4">
              <input type="checkbox" id="acepta-privacidad" checked={aceptaPrivacidad} onChange={(e) => setAceptaPrivacidad(e.target.checked)} className="mt-1 mr-2" required />
              <label htmlFor="acepta-privacidad" className="text-sm text-gray-600 cursor-pointer">
                He leído y acepto el <a href="/aviso-privacidad" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">aviso de privacidad</a>.
              </label>
            </div>
          </div>

          <button type="submit" disabled={cargando} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-60">
            {cargando ? 'Registrando...' : 'Registrarse como Alumno'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-green-600 hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
