import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import {
  Home,
  FolderOpen,
  FileCheck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Shield,
} from 'lucide-react';

const ICONOS_ENLACES = {
  inicio: Home,
  convocatorias: FolderOpen,
  proyectos: BookOpen,
  evaluaciones: ClipboardCheck,
  participantes: Users,
  evaluadores: ShieldCheck,
  reportes: BarChart3,
  usuarios: Users,
  mensajes: MessageSquare,
  calendario: CalendarDays,
  configuracion: Settings,
  roles: Shield,
};

const ENLACES_POR_ROL = {
  [ROLES.ESTUDIANTE]: [
    { to: '/convocatorias', label: 'Convocatorias', icono: 'convocatorias' },
    { to: '/proyectos', label: 'Mis Proyectos', icono: 'proyectos' },
  ],
  [ROLES.DOCENTE_ASESOR]: [
    { to: '/proyectos/asignados', label: 'Proyectos', icono: 'proyectos' },
    { to: '/retroalimentacion', label: 'Retroalimentación', icono: 'evaluaciones' },
  ],
  [ROLES.EVALUADOR]: [
    { to: '/convocatorias', label: 'Convocatorias', icono: 'convocatorias' },
    { to: '/proyectos', label: 'Proyectos Asignados', icono: 'proyectos' },
    { to: '/evaluaciones', label: 'Mis Evaluaciones', icono: 'evaluaciones' },
  ],
  [ROLES.COORDINADOR]: [
    { to: '/dashboard', label: 'Inicio', icono: 'inicio' },
    { to: '/convocatorias', label: 'Convocatorias', icono: 'convocatorias' },
    { to: '/proyectos', label: 'Proyectos', icono: 'proyectos' },
    { to: '/evaluaciones', label: 'Evaluaciones', icono: 'evaluaciones' },
    { to: '/usuarios', label: 'Participantes', icono: 'participantes' },
    { to: '/reportes', label: 'Reportes', icono: 'reportes' },
  ],
  [ROLES.ADMINISTRADOR]: [
    { to: '/dashboard', label: 'Inicio', icono: 'inicio' },
    { to: '/convocatorias', label: 'Convocatorias', icono: 'convocatorias' },
    { to: '/proyectos', label: 'Proyectos', icono: 'proyectos' },
    { to: '/evaluaciones', label: 'Evaluaciones', icono: 'evaluaciones' },
    { to: '/usuarios', label: 'Usuarios', icono: 'usuarios' },
    { to: '/gestion-roles', label: 'Gestión Roles', icono: 'roles' },
    { to: '/reportes', label: 'Reportes', icono: 'reportes' },
    { to: '/configuracion', label: 'Configuración', icono: 'configuracion' },
  ],
};

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const enlaces = (() => {
    if (!user?.roles) return [];
    const mapa = new Map();
    for (const rol of user.roles) {
      const links = ENLACES_POR_ROL[rol] || [];
      for (const link of links) {
        if (!mapa.has(link.to)) mapa.set(link.to, link);
      }
    }
    return Array.from(mapa.values());
  })();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-lg font-bold text-gray-800">
            ConvocaEval <span className="text-blue-600">IA</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {enlaces.map((enlace) => {
            const Icono = ICONOS_ENLACES[enlace.icono] || Home;
            const activo = location.pathname === enlace.to;

            return (
              <Link
                key={enlace.to}
                to={enlace.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activo
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icono
                  size={18}
                  className={activo ? 'text-blue-600' : 'text-gray-400'}
                />
                {enlace.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User size={18} className="text-gray-500" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                {user?.roles?.join(', ') || 'Sin rol'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
