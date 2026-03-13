import { format, differenceInDays, parseISO, isWithinInterval, addDays as dfnsAddDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking, CabinStatus, BookingStatus, PaymentStatus } from '../types';

export const generateId = () => Math.random().toString(36).slice(2, 11);

export const today = () => format(new Date(), 'yyyy-MM-dd');

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const addDays = (dateStr: string, days: number) => {
  const date = parseISO(dateStr);
  return format(dfnsAddDays(date, days), 'yyyy-MM-dd');
};

export const formatDisplayDate = (dateStr: string) => {
  return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const calcNights = (entrada: string, salida: string) => {
  return differenceInDays(parseISO(salida), parseISO(entrada));
};

export const isDateInBooking = (date: string, booking: Booking) => {
  try {
    return isWithinInterval(parseISO(date), {
      start: parseISO(booking.fechaEntrada),
      end: parseISO(booking.fechaSalida),
    });
  } catch {
    return false;
  }
};

export const statusCabanaBadge = (status: CabinStatus) => {
  const map: Record<CabinStatus, { label: string; className: string }> = {
    disponible: { label: 'Disponible', className: 'badge-green' },
    ocupada: { label: 'Ocupada', className: 'badge-red' },
    mantenimiento: { label: 'Mantenimiento', className: 'badge-yellow' },
    reservada: { label: 'Reservada', className: 'badge-blue' },
  };
  return map[status];
};

export const statusReservaBadge = (status: BookingStatus) => {
  const map: Record<BookingStatus, { label: string; className: string }> = {
    confirmada: { label: 'Confirmada', className: 'badge-green' },
    pendiente: { label: 'Pendiente', className: 'badge-yellow' },
    cancelada: { label: 'Cancelada', className: 'badge-red' },
    completada: { label: 'Completada', className: 'badge-gray' },
  };
  return map[status];
};

export const statusPagoBadge = (status: PaymentStatus) => {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    pagado: { label: 'Pagado', className: 'badge-green' },
    pendiente: { label: 'Pendiente', className: 'badge-yellow' },
    parcial: { label: 'Parcial', className: 'badge-blue' },
    reembolsado: { label: 'Reembolsado', className: 'badge-purple' },
  };
  return map[status];
};

export const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(format(new Date(d), 'yyyy-MM-dd'));
  }
  return days;
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
