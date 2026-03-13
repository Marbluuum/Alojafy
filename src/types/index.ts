export type CabinStatus = 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
export type BookingStatus = 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
export type PaymentStatus = 'pagado' | 'pendiente' | 'parcial' | 'reembolsado';

export interface Cabin {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioPorNoche: number;
  estado: CabinStatus;
  amenidades: string[];
  imagenes: string[];
  habitaciones: number;
  banos: number;
  superficieM2: number;
  ubicacion: string;
  createdAt: string;
}

export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  pais: string;
  notas?: string;
  totalReservas: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  cabanaId: string;
  clienteId: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  precioTotal: number;
  precioPorNoche: number;
  estado: BookingStatus;
  estadoPago: PaymentStatus;
  notas?: string;
  desayunoIncluido: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCabanas: number;
  cabanasOcupadas: number;
  totalClientes: number;
  reservasHoy: number;
  ingresosMes: number;
  ocupacionPorcentaje: number;
  reservasPendientes: number;
  checkinsHoy: number;
  checkoutsHoy: number;
}
