import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const reservaSchema = z.object({
  cabanaId: z.string().min(1),
  clienteId: z.string().min(1),
  fechaEntrada: z.string(),
  fechaSalida: z.string(),
  numHuespedes: z.number().int().min(1),
  precioPorNoche: z.number().min(0),
  precioTotal: z.number().min(0),
  estado: z.enum(['confirmada', 'pendiente', 'cancelada', 'completada']).default('pendiente'),
  estadoPago: z.enum(['pagado', 'pendiente', 'parcial', 'reembolsado']).default('pendiente'),
  desayunoIncluido: z.boolean().default(false),
  notas: z.string().optional(),
});

// GET /api/reservas
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado, desde, hasta } = req.query;

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (estado) where.estado = estado;
    if (desde && hasta) {
      where.OR = [
        { fechaEntrada: { gte: desde as string, lte: hasta as string } },
        { fechaSalida: { gte: desde as string, lte: hasta as string } },
      ];
    }

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        cabana: { select: { id: true, nombre: true, precioPorNoche: true } },
        cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaEntrada: 'desc' },
    });

    res.json(reservas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// GET /api/reservas/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        cabana: true,
        cliente: true,
      },
    });

    if (!reserva) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

// POST /api/reservas
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = reservaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    // Verificar que la cabaña pertenece a la organización
    const cabana = await prisma.cabana.findFirst({
      where: { id: parsed.data.cabanaId, organizationId: req.user!.organizationId },
    });
    if (!cabana) {
      res.status(404).json({ error: 'Cabaña no encontrada' });
      return;
    }

    // Verificar que el cliente pertenece a la organización
    const cliente = await prisma.cliente.findFirst({
      where: { id: parsed.data.clienteId, organizationId: req.user!.organizationId },
    });
    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    const reserva = await prisma.reserva.create({
      data: { ...parsed.data, organizationId: req.user!.organizationId },
      include: {
        cabana: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.status(201).json(reserva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// PUT /api/reservas/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = reservaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const existing = await prisma.reserva.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    const updated = await prisma.reserva.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: {
        cabana: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
});

// DELETE /api/reservas/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.reserva.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    await prisma.reserva.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reserva eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

export default router;
