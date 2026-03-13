import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, calcNights, MESES } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import { parseISO, getMonth, getYear } from 'date-fns';

export default function Reportes() {
  const { cabanas, clientes, reservas } = useStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const completadas = useMemo(() =>
    reservas.filter((r) => r.estado === 'completada' || r.estado === 'confirmada'),
    [reservas]
  );

  const ingresosPorMes = useMemo(() => {
    const data = Array(12).fill(0);
    completadas.forEach((r) => {
      const date = parseISO(r.fechaEntrada);
      if (getYear(date) === selectedYear) {
        data[getMonth(date)] += r.precioTotal;
      }
    });
    return data;
  }, [completadas, selectedYear]);

  const maxIngreso = Math.max(...ingresosPorMes, 1);

  const totalAnual = ingresosPorMes.reduce((a, b) => a + b, 0);

  const topCabanas = useMemo(() => {
    const map = new Map<string, { reservas: number; ingresos: number; noches: number }>();
    completadas.forEach((r) => {
      const prev = map.get(r.cabanaId) ?? { reservas: 0, ingresos: 0, noches: 0 };
      map.set(r.cabanaId, {
        reservas: prev.reservas + 1,
        ingresos: prev.ingresos + r.precioTotal,
        noches: prev.noches + calcNights(r.fechaEntrada, r.fechaSalida),
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({
        cabana: cabanas.find((c) => c.id === id),
        ...data,
      }))
      .filter((x) => x.cabana)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);
  }, [completadas, cabanas]);

  const topClientes = useMemo(() => {
    const map = new Map<string, { reservas: number; gasto: number }>();
    reservas.forEach((r) => {
      const prev = map.get(r.clienteId) ?? { reservas: 0, gasto: 0 };
      map.set(r.clienteId, {
        reservas: prev.reservas + 1,
        gasto: prev.gasto + r.precioTotal,
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({
        cliente: clientes.find((c) => c.id === id),
        ...data,
      }))
      .filter((x) => x.cliente)
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 5);
  }, [reservas, clientes]);

  const ocupacionPorCabana = useMemo(() => {
    const daysInYear = 365;
    return cabanas.map((c) => {
      const bookings = completadas.filter((r) => r.cabanaId === c.id);
      const totalNights = bookings.reduce((acc, r) => acc + calcNights(r.fechaEntrada, r.fechaSalida), 0);
      const pct = Math.min(100, Math.round((totalNights / daysInYear) * 100));
      return { cabana: c, noches: totalNights, pct, reservas: bookings.length };
    });
  }, [cabanas, completadas]);

  const estadoReservas = useMemo(() => ({
    confirmada: reservas.filter((r) => r.estado === 'confirmada').length,
    pendiente: reservas.filter((r) => r.estado === 'pendiente').length,
    completada: reservas.filter((r) => r.estado === 'completada').length,
    cancelada: reservas.filter((r) => r.estado === 'cancelada').length,
  }), [reservas]);

  const ticketPromedio = completadas.length > 0
    ? completadas.reduce((a, b) => a + b.precioTotal, 0) / completadas.length
    : 0;

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  return (
    <div>
      <TopBar title="Reportes" subtitle="Análisis y estadísticas del complejo" />
      <div className="p-6 space-y-6">

        {/* Year selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-500 font-medium">Año:</span>
          <div className="flex gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedYear === y ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-dark-200 hover:bg-dark-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-dark-500">Ingresos {selectedYear}</p>
              <div className="p-2 bg-primary-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark-800">{formatCurrency(totalAnual)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-dark-500">Reservas Totales</p>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark-800">{reservas.length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-dark-500">Ticket Promedio</p>
              <div className="p-2 bg-accent-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark-800">{formatCurrency(ticketPromedio)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-dark-500">Clientes Activos</p>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark-800">{clientes.length}</p>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-6">Ingresos Mensuales {selectedYear}</h2>
          <div className="flex items-end gap-2 h-48">
            {ingresosPorMes.map((ingreso, idx) => {
              const height = maxIngreso > 0 ? (ingreso / maxIngreso) * 100 : 0;
              const isCurrentMonth = idx === new Date().getMonth() && selectedYear === new Date().getFullYear();
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer ${
                        isCurrentMonth ? 'bg-primary-600' : 'bg-primary-300 group-hover:bg-primary-400'
                      }`}
                      style={{ height: `${Math.max(4, height)}%` }}
                      title={`${MESES[idx]}: ${formatCurrency(ingreso)}`}
                    />
                    {ingreso > 0 && (
                      <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                        {formatCurrency(ingreso)}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrentMonth ? 'text-primary-600' : 'text-dark-400'}`}>
                    {MESES[idx].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cabanas */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Top Cabañas por Ingresos</h2>
            <div className="space-y-4">
              {topCabanas.map(({ cabana, reservas: numRes, ingresos, noches }, idx) => {
                const maxIng = topCabanas[0]?.ingresos ?? 1;
                const pct = (ingresos / maxIng) * 100;
                return (
                  <div key={cabana!.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          idx === 0 ? 'bg-accent-500' : idx === 1 ? 'bg-dark-400' : 'bg-dark-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-dark-700">{cabana!.nombre}</span>
                      </div>
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(ingresos)}</span>
                    </div>
                    <div className="w-full bg-dark-100 rounded-full h-2 mb-1">
                      <div
                        className="bg-primary-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[11px] text-dark-400">
                      <span>{numRes} reservas</span>
                      <span>{noches} noches</span>
                    </div>
                  </div>
                );
              })}
              {topCabanas.length === 0 && (
                <p className="text-sm text-dark-400 text-center py-4">Sin datos de reservas</p>
              )}
            </div>
          </div>

          {/* Top Clientes */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Top Clientes</h2>
            <div className="space-y-3">
              {topClientes.map(({ cliente, reservas: numRes, gasto }) => (
                <div key={cliente!.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700">
                      {cliente!.nombre.charAt(0)}{cliente!.apellido.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-700">{cliente!.nombre} {cliente!.apellido}</p>
                    <p className="text-xs text-dark-400">{numRes} reserva{numRes !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-dark-700">{formatCurrency(gasto)}</span>
                </div>
              ))}
              {topClientes.length === 0 && (
                <p className="text-sm text-dark-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </div>
        </div>

        {/* Ocupacion por Cabana */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Ocupación por Cabaña</h2>
          <div className="space-y-4">
            {ocupacionPorCabana.map(({ cabana, noches, pct, reservas: numRes }) => (
              <div key={cabana.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-dark-700">{cabana.nombre}</span>
                  <span className="text-sm font-semibold text-dark-600">{pct}%</span>
                </div>
                <div className="w-full bg-dark-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      pct > 70 ? 'bg-primary-500' : pct > 40 ? 'bg-accent-400' : 'bg-dark-300'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-3 mt-1 text-[11px] text-dark-400">
                  <span>{numRes} reservas</span>
                  <span>{noches} noches totales</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado Reservas Pie */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Distribución de Reservas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Confirmadas', value: estadoReservas.confirmada, color: 'bg-primary-500', textColor: 'text-primary-600' },
              { label: 'Pendientes', value: estadoReservas.pendiente, color: 'bg-accent-400', textColor: 'text-accent-600' },
              { label: 'Completadas', value: estadoReservas.completada, color: 'bg-dark-400', textColor: 'text-dark-600' },
              { label: 'Canceladas', value: estadoReservas.cancelada, color: 'bg-red-400', textColor: 'text-red-500' },
            ].map(({ label, value, textColor }) => {
              const total = reservas.length;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeLinecap="round"
                        className={textColor}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-dark-800">{value}</p>
                  <p className="text-xs text-dark-400">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
