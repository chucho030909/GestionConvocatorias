import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Convocatorias from './pages/Convocatorias';
import Proyectos from './pages/Proyectos';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Evaluaciones from './pages/Evaluaciones';
import PublicacionResultados from './pages/PublicacionResultados';
import Retroalimentacion from './pages/Retroalimentacion';
import Configuracion from './pages/Configuracion';
import { ROLES } from './context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/proyectos" replace />;
  }
  return children;
}

function RedireccionInicio() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case ROLES.ADMINISTRADOR:
    case ROLES.COORDINADOR:
      return <Navigate to="/dashboard" replace />;
    case ROLES.ESTUDIANTE:
      return <Navigate to="/proyectos" replace />;
    case ROLES.DOCENTE_ASESOR:
      return <Navigate to="/proyectos/asignados" replace />;
    case ROLES.EVALUADOR:
      return <Navigate to="/evaluaciones" replace />;
    default:
      return <Navigate to="/proyectos" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
            <Route path="convocatorias" element={<Convocatorias />} />
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
            <Route path="mensajes" element={<Proyectos />} />
            <Route path="calendario" element={<Proyectos />} />
            <Route path="publicacion-resultados" element={<PublicacionResultados />} />
            <Route path="retroalimentacion" element={<Retroalimentacion />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
