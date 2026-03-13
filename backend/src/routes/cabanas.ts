import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const cabanaSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().min(5),
  capacidad: z.number().int().min(1),
  precioPorNoche: z.number().min(1),
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'reservada']).default('disponible'),
  habitaciones: z.number().int().min(1).default(1),
  banos: z.number().int().min(1).default(1),
  superficieM2: z.number().min(1).default(50),
  ubicacion: z.string().min(2),
  amenidades: z.array(z.string()).default([]),
  imagenes: z.array(z.string()).default([]),
});

// GET /api/cabanas
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cabanas = await prisma.cabana.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const result = cabanas.map(c => ({
      ...c,
      amenidades: JSON.parse(c.amenidades),
      imagenes: JSON.parse(c.imagenes),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cabañas' });
  }
});

// GET /api/cabanas/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cabana = await prisma.cabana.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
    });

    if (!cabana) {
      res.status(404).json({ error: 'Cabaña no encontrada' });
      return;
    }

    res.json({ ...cabana, amenidades: JSON.parse(cabana.amenidades), imagenes: JSON.parse(cabana.imagenes) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cabaña' });
  }
});

// POST /api/cabanas
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = cabanaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { amenidades, imagenes, ...rest } = parsed.data;

  try {
    const cabana = await prisma.cabana.create({
      data: {
        ...rest,
        amenidades: JSON.stringify(amenidades),
        imagenes: JSON.stringify(imagenes),
        organizationId: req.user!.organizationId,
      },
    });

    res.status(201).json({ ...cabana, amenidades: JSON.parse(cabana.amenidades), imagenes: JSON.parse(cabana.imagenes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cabaña' });
  }
});

// PUT /api/cabanas/:id
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = cabanaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { amenidades, imagenes, ...rest } = parsed.data;

  try {
    const existing = await prisma.cabana.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Cabaña no encontrada' });
      return;
    }

    const updated = await prisma.cabana.update({
      where: { id: req.params.id as string },
      data: {
        ...rest,
        ...(amenidades !== undefined && { amenidades: JSON.stringify(amenidades) }),
        ...(imagenes !== undefined && { imagenes: JSON.stringify(imagenes) }),
      },
    });

    res.json({ ...updated, amenidades: JSON.parse(updated.amenidades), imagenes: JSON.parse(updated.imagenes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar cabaña' });
  }
});

// DELETE /api/cabanas/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.cabana.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Cabaña no encontrada' });
      return;
    }

    await prisma.cabana.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Cabaña eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar cabaña' });
  }
});

export default router;
