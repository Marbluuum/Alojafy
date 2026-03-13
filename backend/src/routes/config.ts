import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const configSchema = z.object({
  nombreComplejo: z.string().optional(),
  moneda: z.enum(['ARS', 'USD', 'EUR']).optional(),
  emailContacto: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

// GET /api/config
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let config = await prisma.config.findUnique({
      where: { organizationId: req.user!.organizationId },
      include: { organization: { select: { name: true, slug: true, plan: true } } },
    });

    if (!config) {
      config = await prisma.config.create({
        data: { organizationId: req.user!.organizationId },
        include: { organization: { select: { name: true, slug: true, plan: true } } },
      });
    }

    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /api/config
router.put('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const config = await prisma.config.upsert({
      where: { organizationId: req.user!.organizationId },
      update: parsed.data,
      create: { organizationId: req.user!.organizationId, ...parsed.data },
    });

    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
