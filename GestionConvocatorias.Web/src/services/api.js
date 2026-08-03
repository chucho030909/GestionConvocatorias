import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5241/api',
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

export async function sugerirEvaluador(proyectoId) {
  const res = await api.post(`/evaluaciones/sugerir/${proyectoId}`);
  return res.data.datos ?? res.data;
}

export async function actualizarEspecialidades(evaluadorId, especialidades) {
  const res = await api.put(`/usuarios/especialidades/${evaluadorId}`, { especialidades });
  return res.data;
}

export async function obtenerHistorico(filtros = {}) {
  const params = {};
  if (filtros.cuatrimestre) params.cuatrimestre = filtros.cuatrimestre;
  if (filtros.categoria) params.categoria = filtros.categoria;
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

// Gestión de usuarios (Administrador)
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

// Asignación de proyectos (Coordinador)
export async function asignarProyecto(id, dto) {
  const res = await api.put(`/proyectos/${id}/asignacion`, dto);
  return res.data;
}

// Avances (Estudiante)
export async function crearAvance(dto) {
  const res = await api.post('/avances', dto);
  return res.data;
}

// Comentarios (DocenteAsesor)
export async function crearComentario(dto) {
  const res = await api.post('/comentarios', dto);
  return res.data;
}

export default api;
