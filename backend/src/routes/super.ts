import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication + SUPER_ADMIN role
router.use(authenticate, requireSuperAdmin);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let attempt = slug;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug: attempt } })) {
    attempt = `${slug}-${i++}`;
  }
  return attempt;
}

const createOrgSchema = z.object({
  name: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  adminName: z.string().min(2, 'Nombre del admin mínimo 2 caracteres'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Contraseña mínimo 8 caracteres'),
  plan: z.enum(['free', 'pro', 'enterprise']).optional().default('free'),
});

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

// POST /api/super/organizations — create a new organization with admin user
router.post('/organizations', async (req: Request, res: Response): Promise<void> => {
  const parsed = createOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, adminName, adminEmail, adminPassword, plan } = parsed.data;

  try {
    const slug = await uniqueSlug(name);
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        plan,
        config: { create: { nombreComplejo: name } },
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = org.users[0];

    res.status(201).json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        createdAt: org.createdAt,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una cuenta con ese email en esa organización' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// GET /api/super/users — all users across all organizations
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        organization: { select: { id: true, name: true, slug: true, plan: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      organization: {
        id: u.organization.id,
        name: u.organization.name,
        slug: u.organization.slug,
        plan: u.organization.plan,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const assignOrgSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

// POST /api/super/users/assign-org — give an existing user access to another org
router.post('/users/assign-org', async (req: Request, res: Response): Promise<void> => {
  const parsed = assignOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { userId, organizationId, role } = parsed.data;

  try {
    const sourceUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!sourceUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const targetOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!targetOrg) {
      res.status(404).json({ error: 'Organización no encontrada' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { email: sourceUser.email, organizationId },
    });
    if (existing) {
      res.status(409).json({ error: 'El usuario ya tiene acceso a esa organización' });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        name: sourceUser.name,
        email: sourceUser.email,
        password: sourceUser.password,
        role,
        organizationId,
        isActive: true,
      },
      include: { organization: { select: { id: true, name: true, slug: true, plan: true } } },
    });

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      organization: newUser.organization,
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      res.status(409).json({ error: 'El usuario ya tiene acceso a esa organización' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

export default router;
