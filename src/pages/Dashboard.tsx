import { useMemo } from 'react';
import {
  Home, Users, TrendingUp, BedDouble,
  Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDisplayDate, today, statusReservaBadge } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { cabanas, clientes, reservas } = useStore();
  const navigate = useNavigate();
  const todayStr = today();

  const stats = useMemo(() => {
    const cabanasOcupadas = cabanas.filter((c) => c.estado === 'ocupada' || c.estado === 'reservada').length;
    const ingresosMes = reservas
      .filter((r) => r.estado !== 'cancelada' && r.createdAt?.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((acc, r) => acc + r.precioTotal, 0);
    const reservasPendientes = reservas.filter((r) => r.estado === 'pendiente').length;
    const checkinsHoy = reservas.filter((r) => r.fechaEntrada === todayStr && r.estado === 'confirmada').length;
    const checkoutsHoy = reservas.filter((r) => r.fechaSalida === todayStr).length;
    return {
      totalCabanas: cabanas.length,
      cabanasOcupadas,
      totalClientes: clientes.length,
      ingresosMes,
      reservasPendientes,
      checkinsHoy,
      checkoutsHoy,
      ocupacion: cabanas.length > 0 ? Math.round((cabanasOcupadas / cabanas.length) * 100) : 0,
    };
  }, [cabanas, clientes, reservas, todayStr]);

  const recentBookings = useMemo(() =>
    [...reservas]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    [reservas]
  );

  const upcomingCheckins = useMemo(() =>
    reservas
      .filter((r) => r.fechaEntrada >= todayStr && r.estado === 'confirmada')
      .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada))
      .slice(0, 5),
    [reservas, todayStr]
  );

  const getCabanaNombre = (id: string) => cabanas.find((c) => c.id === id)?.nombre ?? 'N/A';
  const getClienteNombre = (id: string) => {
    const c = clientes.find((cl) => cl.id === id);
    return c ? `${c.nombre} ${c.apellido}` : 'N/A';
  };

  return (
    <div>
      <TopBar title="Dashboard" subtitle={`Bienvenido, hoy es ${formatDisplayDate(todayStr)}`} />
      <div className="p-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Home className="w-5 h-5 text-primary-600" />}
            iconBg="bg-primary-100"
            label="Total Cabañas"
            value={stats.totalCabanas}
            sub={`${stats.cabanasOcupadas} ocupadas`}
            trend={`${stats.ocupacion}% ocupación`}
            trendUp
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Clientes"
            value={stats.totalClientes}
            sub="registrados"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-accent-600" />}
            iconBg="bg-accent-100"
            label="Ingresos del Mes"
            value={formatCurrency(stats.ingresosMes)}
            sub="este mes"
            trendUp
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-100"
            label="Reservas Pendientes"
            value={stats.reservasPendientes}
            sub="por confirmar"
            trendUp={false}
          />
        </div>

        {/* Today Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate('/hospedajes')}>
            <div className="p-3 bg-green-100 rounded-xl">
              <ArrowDownRight className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-800">{stats.checkinsHoy}</p>
              <p className="text-sm text-dark-500">Check-ins hoy</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate('/hospedajes')}>
            <div className="p-3 bg-orange-100 rounded-xl">
              <ArrowUpRight className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-800">{stats.checkoutsHoy}</p>
              <p className="text-sm text-dark-500">Check-outs hoy</p>
            </div>
          </div>
        </div>

        {/* Cabanas Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Estado de Cabañas</h2>
            <button onClick={() => navigate('/cabanas')} className="text-sm text-primary-600 hover:underline font-medium">
              Ver todas
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cabanas.map((c) => {
              const statusColors: Record<string, string> = {
                disponible: 'border-primary-300 bg-primary-50',
                ocupada: 'border-red-300 bg-red-50',
                reservada: 'border-blue-300 bg-blue-50',
                mantenimiento: 'border-amber-300 bg-amber-50',
              };
              const dotColors: Record<string, string> = {
                disponible: 'bg-primary-500',
                ocupada: 'bg-red-500',
                reservada: 'bg-blue-500',
                mantenimiento: 'bg-amber-500',
              };
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('/cabanas')}
                  className={`rounded-lg border-2 p-3 cursor-pointer ${statusColors[c.estado]} hover:scale-105 transition-transform`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${dotColors[c.estado]}`} />
                    <span className="text-xs font-semibold text-dark-600 capitalize">{c.estado}</span>
                  </div>
                  <p className="text-sm font-medium text-dark-700 truncate">{c.nombre}</p>
                  <p className="text-xs text-dark-400">{c.capacidad} huésp.</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h2 className="section-title">Últimas Reservas</h2>
              <button onClick={() => navigate('/hospedajes')} className="text-sm text-primary-600 hover:underline font-medium">
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-dark-50">
              {recentBookings.map((r) => {
                const sb = statusReservaBadge(r.estado);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-700 truncate">{getClienteNombre(r.clienteId)}</p>
                      <p className="text-xs text-dark-400 truncate">{getCabanaNombre(r.cabanaId)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={sb.className}>{sb.label}</span>
                      <p className="text-xs text-dark-400 mt-1">{formatCurrency(r.precioTotal)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Checkins */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h2 className="section-title">Próximos Check-ins</h2>
              <button onClick={() => navigate('/calendario')} className="text-sm text-primary-600 hover:underline font-medium">
                Ver calendario
              </button>
            </div>
            <div className="divide-y divide-dark-50">
              {upcomingCheckins.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-dark-400">
                  No hay check-ins próximos
                </div>
              ) : (
                upcomingCheckins.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-accent-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-700 leading-none">
                        {new Date(r.fechaEntrada + 'T12:00:00').getDate()}
                      </span>
                      <span className="text-[10px] text-accent-600">
                        {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][new Date(r.fechaEntrada + 'T12:00:00').getMonth()]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-700 truncate">{getClienteNombre(r.clienteId)}</p>
                      <p className="text-xs text-dark-400 truncate">{getCabanaNombre(r.cabanaId)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="badge-blue">{r.numHuespedes} huésp.</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ icon, iconBg, label, value, sub, trend, trendUp }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-dark-800">{value}</p>
          {sub && <p className="text-xs text-dark-400 mt-1">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-primary-600' : 'text-red-500'}`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}
