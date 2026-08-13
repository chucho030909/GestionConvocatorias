import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FolderOpen,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { getDashboardData, getRanking } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORES_CATEGORIA = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DC2626',
  '#0891B2',
];

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function TooltipGrafica({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
      <p className="font-semibold">{label}</p>
      <p>{payload[0].value} registro(s)</p>
    </div>
  );
}

function TooltipDona({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
      <p className="font-semibold">{item.categoria}</p>
      <p>{item.total} proyecto(s)</p>
    </div>
  );
}

function BadgePosicion({ posicion }) {
  const estilos = {
    1: 'bg-yellow-400 text-white',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-yellow-600 text-white',
  };

  if (estilos[posicion]) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${estilos[posicion]}`}
      >
        {posicion}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
      {posicion}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardData(), getRanking(1)])
      .then(([dashData, rankData]) => {
        setDashboard(dashData);
        setRanking(rankData);
      })
      .catch(() => alert('Error al cargar el dashboard.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const kpis = dashboard
    ? [
        {
          icon: FolderOpen,
          label: 'Convocatorias activas',
          value: dashboard.convocatoriasActivas,
          color: '#2563EB',
        },
        {
          icon: ClipboardCheck,
          label: 'Proyectos registrados',
          value: dashboard.totalProyectos,
          color: '#7C3AED',
        },
        {
          icon: GraduationCap,
          label: 'Evaluaciones en progreso',
          value: dashboard.totalEvaluaciones,
          color: '#059669',
        },
        {
          icon: ShieldCheck,
          label: 'Evaluadores activos',
          value: dashboard.proyectosPorEstado?.length || 0,
          color: '#D97706',
        },
      ]
    : [];

  const datosGraficaArea = ranking.length
    ? ranking.map((r, i) => ({
        nombre: r.titulo?.substring(0, 15) || `P${i + 1}`,
        calificacion: r.promedioPuntaje,
      }))
    : [];

  const datosDona = dashboard?.proyectosPorCategoria || [];

  return (
    <div className="min-h-full space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Bienvenido, {user?.name || 'Administrador'}. Resumen ejecutivo del
            sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Resumen general
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={datosGraficaArea}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradCalificacion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <Tooltip content={<TooltipGrafica />} />
              <Area
                type="monotone"
                dataKey="calificacion"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#gradCalificacion)"
                dot={{ r: 4, fill: '#2563EB' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Proyectos por categoría
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosDona}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="total"
                nameKey="categoria"
              >
                {datosDona.map((entry, index) => (
                  <Cell
                    key={entry.categoria}
                    fill={COLORES_CATEGORIA[index % COLORES_CATEGORIA.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<TooltipDona />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Ranking de Proyectos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Proyecto</th>
                <th className="px-6 py-3 font-medium">Equipo</th>
                <th className="px-6 py-3 font-medium">Calificación</th>
                <th className="px-6 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No hay proyectos en el ranking.
                  </td>
                </tr>
              ) : (
                ranking.map((proyecto, index) => (
                  <tr
                    key={proyecto.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <BadgePosicion posicion={index + 1} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">
                        {proyecto.titulo}
                      </p>
                      <p className="text-xs text-gray-400">
                        {proyecto.categoria}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {proyecto.integrantes?.join(', ') || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                        {proyecto.promedioPuntaje.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={15} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
