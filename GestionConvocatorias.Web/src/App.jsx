import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AvisoPrivacidad from './pages/AvisoPrivacidad';
import RecuperarContrasena from './pages/RecuperarContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import Dashboard from './pages/Dashboard';
import Convocatorias from './pages/Convocatorias';
import ConvocatoriasEstudiante from './pages/ConvocatoriasEstudiante';
import ConvocatoriaDetalle from './pages/ConvocatoriaDetalle';
import Proyectos from './pages/Proyectos';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Evaluaciones from './pages/Evaluaciones';
import PublicacionResultados from './pages/PublicacionResultados';
import Retroalimentacion from './pages/Retroalimentacion';
import Configuracion from './pages/Configuracion';
import GestionRoles from './pages/GestionRoles';
import AceptarInvitacion from './pages/AceptarInvitacion';
import Mensajes from './pages/Mensajes';
import Calendario from './pages/Calendario';
import { ROLES } from './context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !user.roles?.some((r) => roles.includes(r))) return <Navigate to="/proyectos" replace />;
  return children;
}

function RedireccionInicio() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const roles = user.roles || [];
  if (roles.includes(ROLES.ADMINISTRADOR) || roles.includes(ROLES.COORDINADOR))
    return <Navigate to="/dashboard" replace />;
  if (roles.includes(ROLES.ESTUDIANTE))
    return <Navigate to="/convocatorias" replace />;
  if (roles.includes(ROLES.DOCENTE_ASESOR))
    return <Navigate to="/proyectos/asignados" replace />;
  if (roles.includes(ROLES.EVALUADOR))
    return <Navigate to="/evaluaciones" replace />;
  return <Navigate to="/proyectos" replace />;
}

function ConvocatoriasRoute() {
  const { user } = useAuth();
  if (user?.roles?.includes(ROLES.ESTUDIANTE)) return <ConvocatoriasEstudiante />;
  return (
    <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.EVALUADOR]}>
      <Convocatorias />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
           <Route path="/login" element={<Login />} />
           <Route path="/register" element={<Register />} />
           <Route path="/aviso-privacidad" element={<AvisoPrivacidad />} />
           <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
           <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
           <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RedireccionInicio />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="convocatorias" element={<ConvocatoriasRoute />} />
            <Route
              path="convocatorias/:id"
              element={
                <ProtectedRoute roles={[ROLES.ESTUDIANTE, ROLES.EVALUADOR, ROLES.COORDINADOR, ROLES.ADMINISTRADOR]}>
                  <ConvocatoriaDetalle />
                </ProtectedRoute>
              }
            />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/nuevo" element={<Proyectos />} />
            <Route path="proyectos/asignados" element={<Proyectos />} />
            <Route path="proyectos/asignacion" element={<Proyectos />} />
            <Route
              path="evaluaciones"
              element={
                <ProtectedRoute roles={[ROLES.EVALUADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                  <Evaluaciones />
                </ProtectedRoute>
              }
            />
            <Route path="mensajes" element={<Mensajes />} />
            <Route path="calendario" element={<Calendario />} />
            <Route
              path="publicacion-resultados"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.EVALUADOR]}>
                  <PublicacionResultados />
                </ProtectedRoute>
              }
            />
            <Route
              path="retroalimentacion"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DOCENTE_ASESOR, ROLES.EVALUADOR, ROLES.ESTUDIANTE]}>
                  <Retroalimentacion />
                </ProtectedRoute>
              }
            />
            <Route
              path="reportes"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                  <Reportes />
                </ProtectedRoute>
              }
            />
            <Route
              path="usuarios"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                  <Usuarios />
                </ProtectedRoute>
              }
            />
            <Route path="configuracion" element={<Configuracion />} />
            <Route
              path="gestion-roles"
              element={
                <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                  <GestionRoles />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
