import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMonthDays, MESES, DIAS_SEMANA_SHORT, formatDisplayDate, statusReservaBadge } from '../utils/helpers';
import { parseISO, format, isWithinInterval, getDay, startOfMonth, getDate } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import type { Booking } from '../types';

export default function Calendario() {
  const { cabanas, reservas, clientes } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('gantt');
  const [selectedCabana, setSelectedCabana] = useState<string>('todas');

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const filteredCabanas = useMemo(
    () => selectedCabana === 'todas' ? cabanas : cabanas.filter((c) => c.id === selectedCabana),
    [cabanas, selectedCabana]
  );

  const getBookingsForCabana = (cabanaId: string) =>
    reservas.filter((r) => r.cabanaId === cabanaId && r.estado !== 'cancelada');

  const getDayBooking = (cabanaId: string, day: string): Booking | undefined => {
    const bookings = getBookingsForCabana(cabanaId);
    return bookings.find((b) => {
      try {
        return isWithinInterval(parseISO(day), {
          start: parseISO(b.fechaEntrada),
          end: parseISO(b.fechaSalida),
        });
      } catch {
        return false;
      }
    });
  };

  const getBookingPosition = (booking: Booking, day: string) => {
    const isStart = booking.fechaEntrada === day;
    const isEnd = booking.fechaSalida === day;
    const isMiddle = !isStart && !isEnd;
    return { isStart, isEnd, isMiddle };
  };

  const getCliente = (id: string) => clientes.find((c) => c.id === id);

  const isGantt = view === 'gantt';
  // Gantt view
  if (isGantt) {
    return (
      <div>
        <TopBar title="Calendario" subtitle="Vista de disponibilidad por cabaña" />
        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 card px-3 py-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-dark-100 text-dark-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-dark-700 min-w-[140px] text-center">
                {MESES[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-dark-100 text-dark-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <select
              value={selectedCabana}
              onChange={(e) => setSelectedCabana(e.target.value)}
              className="input w-auto"
            >
              <option value="todas">Todas las cabañas</option>
              {cabanas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setView('month')}
                className={`btn-sm ${!isGantt ? 'btn-primary' : 'btn-secondary'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setView('gantt')}
                className={`btn-sm ${isGantt ? 'btn-primary' : 'btn-secondary'}`}
              >
                Gantt
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <div className="w-4 h-4 rounded bg-primary-500" />
              Confirmada
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <div className="w-4 h-4 rounded bg-accent-400" />
              Pendiente
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <div className="w-4 h-4 rounded bg-dark-300" />
              Completada
            </div>
          </div>

          {/* Gantt Grid */}
          <div className="card overflow-x-auto">
            <div className="min-w-max">
              {/* Header - Days */}
              <div className="flex border-b border-dark-200 bg-dark-50">
                <div className="w-44 flex-shrink-0 px-4 py-3 text-xs font-semibold text-dark-500 border-r border-dark-200">
                  CABAÑA
                </div>
                {days.map((day) => {
                  const d = parseISO(day);
                  const dayOfWeek = getDay(d);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isToday = day === format(now, 'yyyy-MM-dd');
                  return (
                    <div
                      key={day}
                      className={`w-8 flex-shrink-0 text-center py-3 border-r border-dark-100 ${isWeekend ? 'bg-dark-100' : ''} ${isToday ? 'bg-primary-100' : ''}`}
                    >
                      <div className={`text-[10px] font-bold ${isToday ? 'text-primary-600' : 'text-dark-400'}`}>
                        {getDate(d)}
                      </div>
                      <div className={`text-[9px] ${isToday ? 'text-primary-500' : 'text-dark-300'}`}>
                        {DIAS_SEMANA_SHORT[dayOfWeek]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rows - Cabanas */}
              {filteredCabanas.map((cabana) => {
                return (
                  <div key={cabana.id} className="flex border-b border-dark-100 hover:bg-dark-50 group">
                    <div className="w-44 flex-shrink-0 px-4 py-2 border-r border-dark-200 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-dark-700 truncate">{cabana.nombre}</p>
                      <p className="text-[10px] text-dark-400">{cabana.capacidad} huésp.</p>
                    </div>
                    {days.map((day) => {
                      const booking = getDayBooking(cabana.id, day);
                      const d = parseISO(day);
                      const dayOfWeek = getDay(d);
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isToday = day === format(now, 'yyyy-MM-dd');

                      let cellClass = 'border-r border-dark-100';
                      let bookingBar = null;

                      if (booking) {
                        const { isStart, isEnd } = getBookingPosition(booking, day);
                        const colorMap: Record<string, string> = {
                          confirmada: 'bg-primary-500',
                          pendiente: 'bg-accent-400',
                          completada: 'bg-dark-400',
                          cancelada: 'bg-red-400',
                        };
                        const bgColor = colorMap[booking.estado] ?? 'bg-primary-500';
                        const cliente = getCliente(booking.clienteId);
                        bookingBar = (
                          <div
                            className={`absolute inset-0 ${bgColor} ${isStart ? 'rounded-l-full ml-0.5' : ''} ${isEnd ? 'rounded-r-full mr-0.5' : ''} flex items-center overflow-hidden`}
                            title={`${cliente?.nombre} ${cliente?.apellido ?? ''} | ${booking.fechaEntrada} → ${booking.fechaSalida}`}
                          >
                            {isStart && (
                              <span className="text-white text-[8px] font-medium pl-2 truncate whitespace-nowrap">
                                {cliente?.nombre}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={day}
                          className={`w-8 flex-shrink-0 h-10 relative ${cellClass} ${isWeekend && !booking ? 'bg-dark-50' : ''} ${isToday && !booking ? 'bg-primary-50' : ''}`}
                        >
                          {bookingBar}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming reservations list */}
          <div className="mt-6">
            <h2 className="section-title mb-4">Reservas del Mes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reservas
                .filter((r) => {
                  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
                  return (r.fechaEntrada.startsWith(monthStr) || r.fechaSalida.startsWith(monthStr)) && r.estado !== 'cancelada';
                })
                .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada))
                .map((r) => {
                  const cabana = cabanas.find((c) => c.id === r.cabanaId);
                  const cliente = getCliente(r.clienteId);
                  const sb = statusReservaBadge(r.estado);
                  return (
                    <div key={r.id} className="card p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-800 truncate">
                          {cabana?.nombre ?? 'N/A'}
                        </p>
                        <p className="text-xs text-dark-400">
                          {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'N/A'} · {formatDisplayDate(r.fechaEntrada)} → {formatDisplayDate(r.fechaSalida)}
                        </p>
                      </div>
                      <span className={sb.className}>{sb.label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Monthly calendar view
  const firstDayOfMonth = getDay(startOfMonth(new Date(year, month)));
  const allCalendarDays = [
    ...Array(firstDayOfMonth).fill(null),
    ...days,
  ];

  return (
    <div>
      <TopBar title="Calendario" subtitle="Vista mensual" />
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 card px-3 py-2">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-dark-100 text-dark-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-dark-700 min-w-[140px] text-center">
              {MESES[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-dark-100 text-dark-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setView('month')}
              className={`btn-sm ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setView('gantt')}
              className={`btn-sm ${view === 'gantt' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Gantt
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-dark-100">
            {DIAS_SEMANA_SHORT.map((d) => (
              <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-dark-500 bg-dark-50">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {allCalendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-[100px] border-r border-b border-dark-100 bg-dark-50" />;

              const isToday = day === format(now, 'yyyy-MM-dd');
              const dayBookings = reservas.filter((r) => {
                try {
                  return isWithinInterval(parseISO(day), {
                    start: parseISO(r.fechaEntrada),
                    end: parseISO(r.fechaSalida),
                  }) && r.estado !== 'cancelada';
                } catch {
                  return false;
                }
              });

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-r border-b border-dark-100 p-2 ${isToday ? 'bg-primary-50' : 'hover:bg-dark-50'} transition-colors`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isToday ? 'bg-primary-600 text-white' : 'text-dark-600'
                  }`}>
                    {getDate(parseISO(day))}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => {
                      const cabana = cabanas.find((c) => c.id === b.cabanaId);
                      const colorMap: Record<string, string> = {
                        confirmada: 'bg-primary-500 text-white',
                        pendiente: 'bg-accent-400 text-white',
                        completada: 'bg-dark-400 text-white',
                      };
                      return (
                        <div
                          key={b.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${colorMap[b.estado] ?? 'bg-dark-300 text-white'}`}
                          title={cabana?.nombre}
                        >
                          {cabana?.nombre}
                        </div>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-dark-400 pl-1">+{dayBookings.length - 3} más</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
