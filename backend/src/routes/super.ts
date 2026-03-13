import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication + SUPER_ADMIN role
router.use(authenticate, requireSuperAdmin);

// GET /api/super/stats — platform-wide statistics
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalOrgs, totalUsers, reservasAll] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.reserva.findMany({ select: { precioTotal: true, organizationId: true } }),
    ]);

    const totalReservas = reservasAll.length;
    const totalRevenue = reservasAll.reduce((sum, r) => sum + r.precioTotal, 0);

    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true, reservas: true } },
        reservas: { select: { precioTotal: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const orgsStats = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      createdAt: org.createdAt,
      userCount: org._count.users,
      reservaCount: org._count.reservas,
      revenue: org.reservas.reduce((sum, r) => sum + r.precioTotal, 0),
    }));

    res.json({
      totalOrgs,
      totalUsers,
      totalReservas,
      totalRevenue,
      orgs: orgsStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/super/organizations — list all organizations with stats
router.get('/organizations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true, reservas: true, cabanas: true } },
        reservas: { select: { precioTotal: true } },
        config: { select: { nombreComplejo: true, emailContacto: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      createdAt: org.createdAt,
      userCount: org._count.users,
      reservaCount: org._count.reservas,
      cabanaCount: org._count.cabanas,
      revenue: org.reservas.reduce((sum, r) => sum + r.precioTotal, 0),
      nombreComplejo: org.config?.nombreComplejo ?? null,
      emailContacto: org.config?.emailContacto ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
