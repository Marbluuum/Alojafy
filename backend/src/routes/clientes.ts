import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const clienteSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().min(6),
  dni: z.string().min(6),
  fechaNacimiento: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().default('Argentina'),
  notas: z.string().optional(),
});

// GET /api/clientes
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { _count: { select: { reservas: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const result = clientes.map(c => ({
      ...c,
      cantidadReservas: c._count.reservas,
      _count: undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        reservas: {
          include: { cabana: true },
          orderBy: { fechaEntrada: 'desc' },
        },
      },
    });

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// POST /api/clientes
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const cliente = await prisma.cliente.create({
      data: { ...parsed.data, organizationId: req.user!.organizationId },
    });

    res.status(201).json(cliente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = clienteSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    const updated = await prisma.cliente.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
