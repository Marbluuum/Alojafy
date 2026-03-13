import { useState } from 'react';
import { TrendingUp, DollarSign, Users, BarChart3, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import { formatCurrency, MESES } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';

interface ReporteAnual {
  year: number;
  porMes: { mes: number; ingresos: number; reservas: number }[];
  totalAnual: number;
  totalReservas: number;
  ticketPromedio: number;
  topCabanas: { cabanaId: string; nombre: string; ingresos: number; reservas: number }[];
  topClientes: { clienteId: string; nombre: string; ingresos: number; reservas: number }[];
}

export default function Reportes() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: reporte, isLoading } = useQuery({
    queryKey: ['reporte-anual', selectedYear],
    queryFn: () => dashboardApi.reporteAnual(selectedYear) as Promise<ReporteAnual>,
  });

  const ingresosPorMes = reporte?.porMes.map(m => m.ingresos) ?? Array(12).fill(0);
  const maxIngreso = Math.max(...ingresosPorMes, 1);
  const totalAnual = reporte?.totalAnual ?? 0;
  const ticketPromedio = reporte?.ticketPromedio ?? 0;
  const totalReservas = reporte?.totalReservas ?? 0;
  const topCabanas = reporte?.topCabanas ?? [];
  const topClientes = reporte?.topClientes ?? [];

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Reportes" subtitle="Análisis y estadísticas del complejo" />
      <div className="p-6 space-y-6 flex-1">
        {/* Year selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-surface-500 font-medium">Año:</span>
          <div className="flex gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedYear === y ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
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
              <p className="text-sm text-surface-500">Ingresos {selectedYear}</p>
              <div className="p-2 bg-primary-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-800">{formatCurrency(totalAnual)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-surface-500">Reservas Totales</p>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-800">{totalReservas}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-surface-500">Ticket Promedio</p>
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-800">{formatCurrency(ticketPromedio)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-surface-500">Clientes Activos</p>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-800">{topClientes.length}</p>
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
                      <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                        {formatCurrency(ingreso)}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrentMonth ? 'text-primary-600' : 'text-surface-400'}`}>
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
              {topCabanas.map(({ cabanaId, nombre, reservas: numRes, ingresos }, idx) => {
                const maxIng = topCabanas[0]?.ingresos ?? 1;
                const pct = (ingresos / maxIng) * 100;
                return (
                  <div key={cabanaId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-surface-400' : 'bg-surface-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-surface-700">{nombre}</span>
                      </div>
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(ingresos)}</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2 mb-1">
                      <div className="bg-primary-500 rounded-full h-2 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-3 text-[11px] text-surface-400">
                      <span>{numRes} reservas</span>
                    </div>
                  </div>
                );
              })}
              {topCabanas.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">Sin datos de reservas</p>
              )}
            </div>
          </div>

          {/* Top Clientes */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Top Clientes</h2>
            <div className="space-y-3">
              {topClientes.map(({ clienteId, nombre, reservas: numRes, ingresos }) => (
                <div key={clienteId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700">
                      {nombre.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700">{nombre}</p>
                    <p className="text-xs text-surface-400">{numRes} reserva{numRes !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-surface-700">{formatCurrency(ingresos)}</span>
                </div>
              ))}
              {topClientes.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </div>
        </div>

      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      )}
    </div>
  );
}
