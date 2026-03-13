import { useQuery } from '@tanstack/react-query';
import {
  Home, Users, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight, BedDouble, Loader2,
} from 'lucide-react';
import { dashboardApi, cabanasApi, DashboardStats } from '../lib/api';
import { formatCurrency, formatDisplayDate, today, statusReservaBadge } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const STATUS_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  disponible:   { border: 'border-emerald-300', bg: 'bg-emerald-50',   dot: 'bg-emerald-500' },
  ocupada:      { border: 'border-red-300',     bg: 'bg-red-50',       dot: 'bg-red-500' },
  reservada:    { border: 'border-blue-300',    bg: 'bg-blue-50',      dot: 'bg-blue-500' },
  mantenimiento:{ border: 'border-amber-300',   bg: 'bg-amber-50',     dot: 'bg-amber-500' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const todayStr = today();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  });

  const { data: cabanas = [], isLoading: loadingCabanas } = useQuery({
    queryKey: ['cabanas'],
    queryFn: cabanasApi.list,
  });

  const loading = loadingStats || loadingCabanas;

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`Bienvenido${user?.name ? `, ${user.name}` : ''} — ${formatDisplayDate(todayStr)}`}
        pendingCount={stats?.reservasPendientes}
      />

      <div className="p-6 space-y-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<Home className="w-5 h-5 text-primary-600" />}
                iconBg="bg-primary-50"
                label="Alojamientos"
                value={stats?.totalCabanas ?? 0}
                sub={`${stats?.cabanasOcupadas ?? 0} ocupados`}
                trend={`${stats?.ocupacion ?? 0}% ocupación`}
                trendColor="text-primary-600"
              />
              <KpiCard
                icon={<Users className="w-5 h-5 text-sky-600" />}
                iconBg="bg-sky-50"
                label="Clientes"
                value={stats?.totalClientes ?? 0}
                sub="registrados"
              />
              <KpiCard
                icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                iconBg="bg-amber-50"
                label="Ingresos del Mes"
                value={formatCurrency(stats?.ingresosMes ?? 0)}
                sub="confirmados + completados"
                trendColor="text-emerald-600"
              />
              <KpiCard
                icon={<Clock className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-50"
                label="Pendientes"
                value={stats?.reservasPendientes ?? 0}
                sub="por confirmar"
                trendColor="text-red-500"
              />
            </div>

            {/* Hoy */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/hospedajes')}
                className="card p-4 flex items-center gap-4 text-left hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <ArrowDownRight className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stats?.checkinsHoy ?? 0}</p>
                  <p className="text-xs text-surface-500">Check-ins hoy</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/hospedajes')}
                className="card p-4 flex items-center gap-4 text-left hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <ArrowUpRight className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stats?.checkoutsHoy ?? 0}</p>
                  <p className="text-xs text-surface-500">Check-outs hoy</p>
                </div>
              </button>
            </div>

            {/* Cabañas status */}
            {cabanas.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="section-title">Estado de Alojamientos</h3>
                  <button onClick={() => navigate('/cabanas')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Ver todos →
                  </button>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {cabanas.map((c) => {
                      const s = STATUS_STYLES[c.estado] ?? STATUS_STYLES.disponible;
                      return (
                        <button
                          key={c.id}
                          onClick={() => navigate('/cabanas')}
                          className={`rounded-lg border-2 p-3 text-left hover:opacity-80 transition-opacity ${s.border} ${s.bg}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                            <span className="text-[10px] font-semibold text-surface-600 capitalize">{c.estado}</span>
                          </div>
                          <p className="text-sm font-medium text-surface-800 truncate leading-tight">{c.nombre}</p>
                          <p className="text-xs text-surface-400 mt-0.5">{c.capacidad} huésp.</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Últimas reservas */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="section-title">Últimas Reservas</h3>
                  <button onClick={() => navigate('/hospedajes')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Ver todas →
                  </button>
                </div>
                <div className="divide-y divide-surface-50">
                  {(stats?.reservasRecientes ?? []).length === 0 ? (
                    <p className="text-sm text-surface-400 px-5 py-8 text-center">Sin reservas aún</p>
                  ) : (
                    (stats?.reservasRecientes ?? []).map((r) => {
                      const sb = statusReservaBadge(r.estado);
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50/60 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <BedDouble className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-800 truncate">
                              {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '—'}
                            </p>
                            <p className="text-xs text-surface-400 truncate">{r.cabana?.nombre ?? '—'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={sb.className}>{sb.label}</span>
                            <p className="text-xs text-surface-400 mt-1">{formatCurrency(r.precioTotal)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Próximos check-ins */}
              <RecentCheckins stats={stats} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecentCheckins({ stats }: { stats: DashboardStats | undefined }) {
  const navigate = useNavigate();
  const upcoming = (stats?.reservasRecientes ?? [])
    .filter(r => r.fechaEntrada >= today() && r.estado === 'confirmada')
    .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada))
    .slice(0, 5);

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="section-title">Próximos Check-ins</h3>
        <button onClick={() => navigate('/calendario')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Ver calendario →
        </button>
      </div>
      <div className="divide-y divide-surface-50">
        {upcoming.length === 0 ? (
          <p className="text-sm text-surface-400 px-5 py-8 text-center">No hay check-ins próximos confirmados</p>
        ) : (
          upcoming.map((r) => {
            const d = new Date(r.fechaEntrada + 'T12:00:00');
            const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50/60 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-700 leading-none">{d.getDate()}</span>
                  <span className="text-[10px] text-amber-600 leading-none mt-0.5">{MESES[d.getMonth()]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">
                    {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '—'}
                  </p>
                  <p className="text-xs text-surface-400 truncate">{r.cabana?.nombre ?? '—'}</p>
                </div>
                <span className="badge-blue flex-shrink-0">{r.numHuespedes} huésp.</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendColor?: string;
}

function KpiCard({ icon, iconBg, label, value, sub, trend, trendColor }: KpiCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-surface-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-surface-900 leading-tight">{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1.5 ${trendColor ?? 'text-surface-500'}`}>{trend}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ml-2 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}
