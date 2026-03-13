import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cabin, Client, Booking } from '../types';
import { generateId, today, addDays, formatDate } from '../utils/helpers';

interface AppState {
  cabanas: Cabin[];
  clientes: Client[];
  reservas: Booking[];

  // Cabanas
  addCabana: (cabin: Omit<Cabin, 'id' | 'createdAt'>) => void;
  updateCabana: (id: string, cabin: Partial<Cabin>) => void;
  deleteCabana: (id: string) => void;

  // Clientes
  addCliente: (client: Omit<Client, 'id' | 'createdAt' | 'totalReservas'>) => void;
  updateCliente: (id: string, client: Partial<Client>) => void;
  deleteCliente: (id: string) => void;

  // Reservas
  addReserva: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReserva: (id: string, booking: Partial<Booking>) => void;
  deleteReserva: (id: string) => void;
}

const DEMO_CABANAS: Cabin[] = [
  {
    id: 'c1',
    nombre: 'Cabaña Los Pinos',
    descripcion: 'Acogedora cabaña rodeada de pinos con vista al lago. Perfecta para familias y parejas que buscan tranquilidad.',
    capacidad: 6,
    precioPorNoche: 12500,
    estado: 'disponible',
    amenidades: ['WiFi', 'Parrilla', 'Pileta', 'Estacionamiento', 'TV', 'Cocina completa'],
    imagenes: [],
    habitaciones: 3,
    banos: 2,
    superficieM2: 85,
    ubicacion: 'Sector A - Frente al lago',
    createdAt: '2024-01-10',
  },
  {
    id: 'c2',
    nombre: 'Cabaña El Roble',
    descripcion: 'Cabaña de madera nativa con chimenea, ideal para invierno. Ambiente romántico y acogedor.',
    capacidad: 4,
    precioPorNoche: 9800,
    estado: 'ocupada',
    amenidades: ['WiFi', 'Chimenea', 'Parrilla', 'Estacionamiento', 'TV', 'Jacuzzi'],
    imagenes: [],
    habitaciones: 2,
    banos: 1,
    superficieM2: 65,
    ubicacion: 'Sector B - Bosque',
    createdAt: '2024-01-10',
  },
  {
    id: 'c3',
    nombre: 'Suite La Montaña',
    descripcion: 'Suite premium con terraza panorámica y vista a la montaña. Lujo y confort en plena naturaleza.',
    capacidad: 2,
    precioPorNoche: 18000,
    estado: 'reservada',
    amenidades: ['WiFi', 'Jacuzzi privado', 'Parrilla', 'Desayuno', 'TV Smart', 'Minibar'],
    imagenes: [],
    habitaciones: 1,
    banos: 1,
    superficieM2: 45,
    ubicacion: 'Sector C - Vista panorámica',
    createdAt: '2024-01-15',
  },
  {
    id: 'c4',
    nombre: 'Cabaña Familiar Grande',
    descripcion: 'Amplia cabaña para grupos grandes. Espacio exterior con fogón y áreas de juego para niños.',
    capacidad: 10,
    precioPorNoche: 22000,
    estado: 'disponible',
    amenidades: ['WiFi', 'Parrilla', 'Pileta', 'Fogón', 'Estacionamiento', 'TV', 'Cocina industrial'],
    imagenes: [],
    habitaciones: 4,
    banos: 3,
    superficieM2: 140,
    ubicacion: 'Sector A - Área familiar',
    createdAt: '2024-02-01',
  },
  {
    id: 'c5',
    nombre: 'Cabaña Serrana',
    descripcion: 'En las alturas de la sierra, con espectacular vista al valle. Contacto directo con la naturaleza.',
    capacidad: 4,
    precioPorNoche: 11000,
    estado: 'mantenimiento',
    amenidades: ['WiFi', 'Parrilla', 'Estacionamiento', 'Cocina equipada'],
    imagenes: [],
    habitaciones: 2,
    banos: 1,
    superficieM2: 70,
    ubicacion: 'Sector D - Sierra',
    createdAt: '2024-02-15',
  },
];

const DEMO_CLIENTES: Client[] = [
  {
    id: 'cl1',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@email.com',
    telefono: '+54 9 351 234-5678',
    dni: '28.456.789',
    pais: 'Argentina',
    ciudad: 'Córdoba',
    totalReservas: 3,
    createdAt: '2024-03-01',
  },
  {
    id: 'cl2',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'carlos.rod@email.com',
    telefono: '+54 9 11 9876-5432',
    dni: '31.234.567',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    totalReservas: 1,
    createdAt: '2024-03-10',
  },
  {
    id: 'cl3',
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@email.com',
    telefono: '+54 9 261 345-6789',
    dni: '25.678.901',
    pais: 'Argentina',
    ciudad: 'Mendoza',
    totalReservas: 5,
    createdAt: '2024-01-20',
  },
  {
    id: 'cl4',
    nombre: 'Lucas',
    apellido: 'Fernández',
    email: 'lucas.f@email.com',
    telefono: '+54 9 341 456-7890',
    dni: '33.456.789',
    pais: 'Argentina',
    ciudad: 'Rosario',
    totalReservas: 2,
    createdAt: '2024-04-05',
  },
];

const DEMO_RESERVAS: Booking[] = [
  {
    id: 'r1',
    cabanaId: 'c2',
    clienteId: 'cl1',
    fechaEntrada: today(),
    fechaSalida: addDays(today(), 3),
    numHuespedes: 3,
    precioTotal: 29400,
    precioPorNoche: 9800,
    estado: 'confirmada',
    estadoPago: 'pagado',
    desayunoIncluido: false,
    notas: 'Solicita habitación con vista al jardín',
    createdAt: formatDate(new Date(Date.now() - 7 * 86400000)),
    updatedAt: formatDate(new Date(Date.now() - 7 * 86400000)),
  },
  {
    id: 'r2',
    cabanaId: 'c3',
    clienteId: 'cl3',
    fechaEntrada: addDays(today(), 2),
    fechaSalida: addDays(today(), 5),
    numHuespedes: 2,
    precioTotal: 54000,
    precioPorNoche: 18000,
    estado: 'confirmada',
    estadoPago: 'parcial',
    desayunoIncluido: true,
    createdAt: formatDate(new Date(Date.now() - 3 * 86400000)),
    updatedAt: formatDate(new Date(Date.now() - 3 * 86400000)),
  },
  {
    id: 'r3',
    cabanaId: 'c1',
    clienteId: 'cl2',
    fechaEntrada: addDays(today(), 7),
    fechaSalida: addDays(today(), 10),
    numHuespedes: 5,
    precioTotal: 37500,
    precioPorNoche: 12500,
    estado: 'pendiente',
    estadoPago: 'pendiente',
    desayunoIncluido: false,
    createdAt: formatDate(new Date(Date.now() - 1 * 86400000)),
    updatedAt: formatDate(new Date(Date.now() - 1 * 86400000)),
  },
  {
    id: 'r4',
    cabanaId: 'c4',
    clienteId: 'cl4',
    fechaEntrada: addDays(today(), -10),
    fechaSalida: addDays(today(), -7),
    numHuespedes: 8,
    precioTotal: 66000,
    precioPorNoche: 22000,
    estado: 'completada',
    estadoPago: 'pagado',
    desayunoIncluido: false,
    createdAt: formatDate(new Date(Date.now() - 20 * 86400000)),
    updatedAt: formatDate(new Date(Date.now() - 7 * 86400000)),
  },
  {
    id: 'r5',
    cabanaId: 'c1',
    clienteId: 'cl3',
    fechaEntrada: addDays(today(), -30),
    fechaSalida: addDays(today(), -27),
    numHuespedes: 4,
    precioTotal: 37500,
    precioPorNoche: 12500,
    estado: 'completada',
    estadoPago: 'pagado',
    desayunoIncluido: true,
    createdAt: formatDate(new Date(Date.now() - 40 * 86400000)),
    updatedAt: formatDate(new Date(Date.now() - 27 * 86400000)),
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      cabanas: DEMO_CABANAS,
      clientes: DEMO_CLIENTES,
      reservas: DEMO_RESERVAS,

      addCabana: (cabin) => set((state) => ({
        cabanas: [...state.cabanas, { ...cabin, id: generateId(), createdAt: today() }],
      })),

      updateCabana: (id, cabin) => set((state) => ({
        cabanas: state.cabanas.map((c) => c.id === id ? { ...c, ...cabin } : c),
      })),

      deleteCabana: (id) => set((state) => ({
        cabanas: state.cabanas.filter((c) => c.id !== id),
      })),

      addCliente: (client) => set((state) => ({
        clientes: [...state.clientes, { ...client, id: generateId(), createdAt: today(), totalReservas: 0 }],
      })),

      updateCliente: (id, client) => set((state) => ({
        clientes: state.clientes.map((c) => c.id === id ? { ...c, ...client } : c),
      })),

      deleteCliente: (id) => set((state) => ({
        clientes: state.clientes.filter((c) => c.id !== id),
      })),

      addReserva: (booking) => {
        const newBooking = { ...booking, id: generateId(), createdAt: today(), updatedAt: today() };
        set((state) => {
          const clientes = state.clientes.map((c) =>
            c.id === booking.clienteId ? { ...c, totalReservas: c.totalReservas + 1 } : c
          );
          return { reservas: [...state.reservas, newBooking], clientes };
        });
      },

      updateReserva: (id, booking) => set((state) => ({
        reservas: state.reservas.map((r) => r.id === id ? { ...r, ...booking, updatedAt: today() } : r),
      })),

      deleteReserva: (id) => set((state) => ({
        reservas: state.reservas.filter((r) => r.id !== id),
      })),
    }),
    { name: 'alojafy-storage' }
  )
);
