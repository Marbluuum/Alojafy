import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const orgId = req.user!.organizationId;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [
      totalCabanas,
      totalClientes,
      reservasPendientes,
      reservasConfirmadas,
      cabanasOcupadas,
      ingresosMes,
      checkinsHoy,
      checkoutsHoy,
      reservasRecientes,
    ] = await Promise.all([
      prisma.cabana.count({ where: { organizationId: orgId } }),
      prisma.cliente.count({ where: { organizationId: orgId } }),
      prisma.reserva.count({ where: { organizationId: orgId, estado: 'pendiente' } }),
      prisma.reserva.count({ where: { organizationId: orgId, estado: 'confirmada' } }),
      prisma.reserva.count({
        where: {
          organizationId: orgId,
          estado: 'confirmada',
          fechaEntrada: { lte: today },
          fechaSalida: { gt: today },
        },
      }),
      // Ingresos del mes actual
      prisma.reserva.aggregate({
        where: {
          organizationId: orgId,
          estado: { in: ['confirmada', 'completada'] },
          estadoPago: { in: ['pagado', 'parcial'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { precioTotal: true },
      }),
      // Check-ins hoy
      prisma.reserva.count({
        where: { organizationId: orgId, fechaEntrada: today },
      }),
      // Check-outs hoy
      prisma.reserva.count({
        where: { organizationId: orgId, fechaSalida: today },
      }),
      // Últimas 5 reservas
      prisma.reserva.findMany({
        where: { organizationId: orgId },
        include: {
          cabana: { select: { nombre: true } },
          cliente: { select: { nombre: true, apellido: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const ocupacion = totalCabanas > 0 ? Math.round((cabanasOcupadas / totalCabanas) * 100) : 0;

    res.json({
      totalCabanas,
      cabanasOcupadas,
      totalClientes,
      reservasPendientes,
      reservasConfirmadas,
      ingresosMes: ingresosMes._sum.precioTotal ?? 0,
      ocupacion,
      checkinsHoy,
      checkoutsHoy,
      reservasRecientes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/dashboard/reportes/anual?year=2024
router.get('/reportes/anual', async (req: Request, res: Response): Promise<void> => {
  const orgId = req.user!.organizationId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  try {
    const reservas = await prisma.reserva.findMany({
      where: {
        organizationId: orgId,
        estado: { in: ['confirmada', 'completada'] },
        fechaEntrada: {
          gte: `${year}-01-01`,
          lte: `${year}-12-31`,
        },
      },
    });

    // Agrupar por mes
    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      ingresos: 0,
      reservas: 0,
    }));

    for (const r of reservas) {
      const mes = parseInt(r.fechaEntrada.split('-')[1]) - 1;
      if (mes >= 0 && mes < 12) {
        porMes[mes].ingresos += r.precioTotal;
        porMes[mes].reservas += 1;
      }
    }

    // Top cabañas
    const topCabanas = await prisma.reserva.groupBy({
      by: ['cabanaId'],
      where: {
        organizationId: orgId,
        estado: { in: ['confirmada', 'completada'] },
        fechaEntrada: { gte: `${year}-01-01`, lte: `${year}-12-31` },
      },
      _sum: { precioTotal: true },
      _count: { id: true },
      orderBy: { _sum: { precioTotal: 'desc' } },
      take: 5,
    });

    const cabanasIds = topCabanas.map(c => c.cabanaId);
    const cabanasData = await prisma.cabana.findMany({ where: { id: { in: cabanasIds } } });

    const topCabanasConNombre = topCabanas.map(c => {
      const cabana = cabanasData.find(cd => cd.id === c.cabanaId);
      return {
        cabanaId: c.cabanaId,
        nombre: cabana?.nombre ?? 'Desconocida',
        ingresos: c._sum.precioTotal ?? 0,
        reservas: c._count.id,
      };
    });

    // Top clientes
    const topClientes = await prisma.reserva.groupBy({
      by: ['clienteId'],
      where: {
        organizationId: orgId,
        estado: { in: ['confirmada', 'completada'] },
        fechaEntrada: { gte: `${year}-01-01`, lte: `${year}-12-31` },
      },
      _sum: { precioTotal: true },
      _count: { id: true },
      orderBy: { _sum: { precioTotal: 'desc' } },
      take: 5,
    });

    const clientesIds = topClientes.map(c => c.clienteId);
    const clientesData = await prisma.cliente.findMany({ where: { id: { in: clientesIds } } });

    const topClientesConNombre = topClientes.map(c => {
      const cliente = clientesData.find(cd => cd.id === c.clienteId);
      return {
        clienteId: c.clienteId,
        nombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido',
        ingresos: c._sum.precioTotal ?? 0,
        reservas: c._count.id,
      };
    });

    const totalAnual = porMes.reduce((sum, m) => sum + m.ingresos, 0);
    const totalReservas = porMes.reduce((sum, m) => sum + m.reservas, 0);

    res.json({
      year,
      porMes,
      totalAnual,
      totalReservas,
      ticketPromedio: totalReservas > 0 ? totalAnual / totalReservas : 0,
      topCabanas: topCabanasConNombre,
      topClientes: topClientesConNombre,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

export default router;
