import axios from 'axios';

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname === 'localhost') return 'http://localhost:5241/api';
  return 'https://gestion-convocatorias-api.onrender.com/api';
}

const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Convocatorias (Estudiante)
export async function obtenerConvocatoriasActivas() {
  const res = await api.get('/convocatorias/activas');
  return res.data;
}

export async function obtenerMisRegistros() {
  const res = await api.get('/convocatorias/mis-registros');
  return res.data;
}

export async function registrarseConvocatoria(convocatoriaId) {
  const res = await api.post(`/convocatorias/${convocatoriaId}/registrar`);
  return res.data;
}

export async function cancelarRegistro(convocatoriaId) {
  const res = await api.delete(`/convocatorias/${convocatoriaId}/cancelar-registro`);
  return res.data;
}

export async function obtenerMiProyectoEnConvocatoria(convocatoriaId) {
  const res = await api.get(`/convocatorias/${convocatoriaId}/mi-proyecto`);
  return res.data;
}

// Proyectos (Estudiante)
export async function crearProyecto(formData) {
  const res = await api.post('/proyectos', formData);
  return res.data;
}

export async function obtenerProyecto(id) {
  const res = await api.get(`/proyectos/${id}`);
  return res.data;
}

export async function obtenerMisProyectos() {
  const res = await api.get('/proyectos/MisProyectos');
  return res.data;
}

// Integrantes
export async function agregarIntegrante(proyectoId, email) {
  const res = await api.post(`/proyectos/${proyectoId}/integrantes`, { email });
  return res.data;
}

// Avances
export async function crearAvance(formData) {
  const res = await api.post('/avances', formData);
  return res.data;
}

export async function obtenerAvancesPorProyecto(proyectoId) {
  const res = await api.get(`/avances/proyecto/${proyectoId}`);
  return res.data;
}

// Documentos
export async function subirDocumento(formData) {
  const res = await api.post('/documentos/subir', formData);
  return res.data;
}

// Archivos
export function descargarArchivo(rutaRelativa) {
  return `${api.defaults.baseURL}/proyectos/archivos/${encodeURIComponent(rutaRelativa)}`;
}

export async function abrirArchivoConvocatoria(id, tipo) {
  const response = await api.get(
    `/convocatorias/${id}/archivos/${tipo}`,
    { responseType: 'blob' }
  );

  const contentType =
    response.headers['content-type'] || 'application/octet-stream';

  const url = URL.createObjectURL(
    new Blob([response.data], { type: contentType })
  );

  window.open(url, '_blank', 'noopener,noreferrer');

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Evaluador
export async function sugerirEvaluador(proyectoId) {
  const res = await api.post(`/evaluaciones/sugerir/${proyectoId}`);
  return res.data.datos ?? res.data;
}

export async function actualizarEspecialidades(evaluadorId, especialidades) {
  const res = await api.put(`/usuarios/especialidades/${evaluadorId}`, { especialidades });
  return res.data;
}

// Reportes
export async function obtenerHistorico(filtros = {}) {
  const params = {};
  if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
  if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;
  if (filtros.categoria && filtros.categoria !== 'Todas') params.categoria = filtros.categoria;
  const res = await api.get('/reportes/historico', { params });
  return res.data;
}

export async function getDashboardData() {
  const res = await api.get('/reportes/dashboard');
  return res.data;
}

export async function getRanking(convocatoriaId = 1) {
  const res = await api.get(`/reportes/ranking/${convocatoriaId}`);
  return res.data;
}

export async function exportarProyecto(proyectoId) {
  const res = await api.get(`/reportes/exportar/${proyectoId}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reporte-proyecto-${proyectoId}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Usuarios (Admin)
export async function obtenerUsuarios() {
  const res = await api.get('/usuarios');
  return res.data;
}

export async function crearUsuario(dto) {
  const res = await api.post('/usuarios', dto);
  return res.data;
}

export async function editarUsuario(id, dto) {
  const res = await api.put(`/usuarios/${id}`, dto);
  return res.data;
}

export async function cambiarEstadoUsuario(id, activo) {
  const res = await api.put(`/usuarios/${id}/estado`, activo);
  return res.data;
}

export async function actualizarRolesUsuario(id, roles) {
  const res = await api.put(`/usuarios/${id}/roles`, { roles });
  return res.data;
}

// Auth (público)
export async function recuperarContrasena(correoElectronico) {
  const res = await api.post('/auth/recuperar-contrasena', { correoElectronico });
  return res.data;
}

export async function restablecerContrasena(token, nuevaContrasena) {
  const res = await api.post('/auth/restablecer-contrasena', { token, nuevaContrasena });
  return res.data;
}

export async function registrarEstudiante(formData) {
  const res = await api.post('/auth/registrar-estudiante', formData);
  return res.data;
}

// Asignación (Coordinador)
export async function asignarProyecto(id, dto) {
  const res = await api.put(`/proyectos/${id}/asignacion`, dto);
  return res.data;
}

// Invitar evaluador (desde sugeridos IA)
export async function invitarEvaluador(proyectoId, evaluadorId) {
  const res = await api.post(`/proyectos/${proyectoId}/invitar-evaluador`, { evaluadorId });
  return res.data;
}

// Rechazar evaluación (Evaluador)
export async function rechazarEvaluador(proyectoId) {
  const res = await api.put(`/proyectos/${proyectoId}/rechazar-evaluador`);
  return res.data;
}

// GitHub
export async function crearRepositorio(proyectoId) {
  const res = await api.post(`/proyectos/${proyectoId}/crear-repositorio`);
  return res.data;
}

export { api };
export default api;
