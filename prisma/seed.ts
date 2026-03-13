import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin1234', 12);

  // Create Platform organization for Super Admin
  const platformOrg = await prisma.organization.upsert({
    where: { slug: 'alojafy-platform' },
    update: {},
    create: {
      name: 'Alojafy Platform',
      slug: 'alojafy-platform',
      plan: 'enterprise',
      config: {
        create: {
          nombreComplejo: 'Alojafy Platform',
          moneda: 'ARS',
          emailContacto: 'martin@enbiconsulting.com',
        },
      },
    },
  });

  // Super Admin user
  const superAdminPassword = await bcrypt.hash('Martin2024!', 12);
  await prisma.user.upsert({
    where: { id: 'user-super-admin-seed' },
    update: {},
    create: {
      id: 'user-super-admin-seed',
      name: 'Martin Bufczyk',
      email: 'martin@enbiconsulting.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      organizationId: platformOrg.id,
    },
  });

  // Crear organización demo
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-complejo' },
    update: {},
    create: {
      name: 'Complejo Serrano Demo',
      slug: 'demo-complejo',
      plan: 'pro',
      config: {
        create: {
          nombreComplejo: 'Complejo Serrano Demo',
          moneda: 'ARS',
          emailContacto: 'info@complejoserrano.com',
          telefono: '+54 351 555-0100',
          direccion: 'Ruta 20 Km 15, Villa Carlos Paz, Córdoba',
          checkInTime: '14:00',
          checkOutTime: '10:00',
        },
      },
    },
  });

  // Admin user
  await prisma.user.upsert({
    where: { id: 'user-admin-seed' },
    update: {},
    create: {
      id: 'user-admin-seed',
      name: 'Administrador',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Regular user
  await prisma.user.upsert({
    where: { id: 'user-staff-seed' },
    update: {},
    create: {
      id: 'user-staff-seed',
      name: 'Personal Recepción',
      email: 'recepcion@demo.com',
      password: await bcrypt.hash('staff1234', 12),
      role: 'USER',
      organizationId: org.id,
    },
  });

  // Cabañas
  const cabanas = [
    { id: 'cab-1', nombre: 'Los Pinos', descripcion: 'Cabaña entre pinos con vista al lago', capacidad: 4, precioPorNoche: 18000, estado: 'disponible', habitaciones: 2, banos: 1, superficieM2: 65, ubicacion: 'Sector Norte', amenidades: '["WiFi","Parrilla","Aire acondicionado","Calefacción","Pileta","Estacionamiento"]' },
    { id: 'cab-2', nombre: 'El Roble', descripcion: 'Cabaña familiar con galería panorámica', capacidad: 6, precioPorNoche: 24000, estado: 'ocupada', habitaciones: 3, banos: 2, superficieM2: 90, ubicacion: 'Sector Sur', amenidades: '["WiFi","Parrilla","Calefacción","Estacionamiento","Cocina completa"]' },
    { id: 'cab-3', nombre: 'Suite La Montaña', descripcion: 'Suite de lujo con jacuzzi y vista a la montaña', capacidad: 2, precioPorNoche: 35000, estado: 'reservada', habitaciones: 1, banos: 1, superficieM2: 50, ubicacion: 'Sector Alto', amenidades: '["WiFi","Jacuzzi","Calefacción","Netflix","Desayuno incluido","Estacionamiento"]' },
    { id: 'cab-4', nombre: 'Familiar Grande', descripcion: 'Ideal para familias numerosas con espacio de juegos', capacidad: 8, precioPorNoche: 42000, estado: 'disponible', habitaciones: 4, banos: 2, superficieM2: 120, ubicacion: 'Sector Lago', amenidades: '["WiFi","Parrilla","Pileta","Aire acondicionado","Calefacción","Estacionamiento","Cocina completa","Espacio juegos"]' },
    { id: 'cab-5', nombre: 'Serrana', descripcion: 'Cabaña rústica auténtica con chimenea', capacidad: 4, precioPorNoche: 20000, estado: 'mantenimiento', habitaciones: 2, banos: 1, superficieM2: 70, ubicacion: 'Sector Bosque', amenidades: '["WiFi","Parrilla","Chimenea","Calefacción","Estacionamiento"]' },
  ];

  for (const cab of cabanas) {
    await prisma.cabana.upsert({
      where: { id: cab.id },
      update: {},
      create: { ...cab, imagenes: '[]', organizationId: org.id },
    });
  }

  // Clientes
  const clientes = [
    { id: 'cli-1', nombre: 'María', apellido: 'González', email: 'maria@email.com', telefono: '+54 11 4444-1234', dni: '28.456.789', pais: 'Argentina', ciudad: 'Buenos Aires' },
    { id: 'cli-2', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@email.com', telefono: '+54 351 333-5678', dni: '32.111.222', pais: 'Argentina', ciudad: 'Córdoba' },
    { id: 'cli-3', nombre: 'Ana', apellido: 'Martínez', email: 'ana@email.com', telefono: '+54 261 555-9012', dni: '35.888.999', pais: 'Argentina', ciudad: 'Mendoza' },
    { id: 'cli-4', nombre: 'Lucas', apellido: 'Fernández', email: 'lucas@email.com', telefono: '+54 11 6666-3456', dni: '40.123.456', pais: 'Argentina', ciudad: 'Rosario' },
  ];

  for (const cli of clientes) {
    await prisma.cliente.upsert({
      where: { id: cli.id },
      update: {},
      create: { ...cli, organizationId: org.id },
    });
  }

  // Reservas
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const reservas = [
    { id: 'res-1', cabanaId: 'cab-2', clienteId: 'cli-1', fechaEntrada: fmt(addDays(today, -2)), fechaSalida: fmt(addDays(today, 3)), numHuespedes: 4, precioPorNoche: 24000, precioTotal: 120000, estado: 'confirmada', estadoPago: 'pagado' },
    { id: 'res-2', cabanaId: 'cab-3', clienteId: 'cli-2', fechaEntrada: fmt(addDays(today, 2)), fechaSalida: fmt(addDays(today, 5)), numHuespedes: 2, precioPorNoche: 35000, precioTotal: 105000, estado: 'confirmada', estadoPago: 'parcial' },
    { id: 'res-3', cabanaId: 'cab-1', clienteId: 'cli-3', fechaEntrada: fmt(addDays(today, 7)), fechaSalida: fmt(addDays(today, 10)), numHuespedes: 3, precioPorNoche: 18000, precioTotal: 54000, estado: 'pendiente', estadoPago: 'pendiente' },
    { id: 'res-4', cabanaId: 'cab-4', clienteId: 'cli-4', fechaEntrada: fmt(addDays(today, -10)), fechaSalida: fmt(addDays(today, -5)), numHuespedes: 6, precioPorNoche: 42000, precioTotal: 210000, estado: 'completada', estadoPago: 'pagado' },
    { id: 'res-5', cabanaId: 'cab-1', clienteId: 'cli-2', fechaEntrada: fmt(addDays(today, 15)), fechaSalida: fmt(addDays(today, 18)), numHuespedes: 2, precioPorNoche: 18000, precioTotal: 54000, estado: 'pendiente', estadoPago: 'pendiente' },
  ];

  for (const res of reservas) {
    await prisma.reserva.upsert({
      where: { id: res.id },
      update: {},
      create: { ...res, organizationId: org.id, desayunoIncluido: false },
    });
  }

  console.log('✅ Seed completado!');
  console.log('   Super Admin: martin@enbiconsulting.com / Martin2024!');
  console.log('   Admin: admin@demo.com / admin1234');
  console.log('   Staff: recepcion@demo.com / staff1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
