import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { sendPasswordResetEmail, sendActivationEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Nombre de empresa mínimo 2 caracteres'),
  name: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña mínimo 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  organizationSlug: z.string().optional(),
});

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

// POST /api/auth/register — crea organización + admin
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { organizationName, name, email, password } = parsed.data;

  try {
    const slug = await uniqueSlug(organizationName);
    const hashedPassword = await bcrypt.hash(password, 12);

    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug,
        config: { create: { nombreComplejo: organizationName } },
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = org.users[0];
    const token = signToken({
      userId: user.id,
      organizationId: org.id,
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
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

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const { email, password, organizationSlug } = parsed.data;

  try {
    let user;

    if (organizationSlug) {
      const org = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
      if (!org) {
        res.status(401).json({ error: 'Organización no encontrada' });
        return;
      }
      user = await prisma.user.findFirst({
        where: { email, organizationId: org.id },
        include: { organization: true },
      });
    } else {
      // Busca en todas las organizaciones, devuelve el primer match
      user = await prisma.user.findFirst({
        where: { email },
        include: { organization: true },
      });
    }

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    if (!user.organization.isActive) {
      res.status(403).json({ error: 'Esta cuenta está desactivada. Contactá al administrador.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const token = signToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    });

    // Find all orgs this email belongs to
    const allUserRecords = await prisma.user.findMany({
      where: { email: user.email },
      include: { organization: true },
    });

    const organizations = allUserRecords.map((u) => ({
      id: u.organization.id,
      name: u.organization.name,
      slug: u.organization.slug,
      plan: u.organization.plan,
      role: u.role,
    }));

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
      },
      organizations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [user, organization] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.userId } }),
      prisma.organization.findUnique({ where: { id: req.user!.organizationId } }),
    ]);

    if (!user || !organization) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        isActive: organization.isActive,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/organizations — returns all orgs for the current user's email
// For SUPER_ADMIN: returns ALL organizations
router.get('/organizations', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'SUPER_ADMIN') {
      const allOrgs = await prisma.organization.findMany({ orderBy: { createdAt: 'asc' } });
      const organizations = allOrgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        role: 'SUPER_ADMIN' as const,
      }));
      res.json({ organizations });
      return;
    }

    const allUserRecords = await prisma.user.findMany({
      where: { email: req.user!.email },
      include: { organization: true },
    });

    const organizations = allUserRecords.map((u) => ({
      id: u.organization.id,
      name: u.organization.name,
      slug: u.organization.slug,
      plan: u.organization.plan,
      role: u.role,
    }));

    res.json({ organizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/switch-org — switch to a different organization
// For SUPER_ADMIN: allows switching to any org, keeping SUPER_ADMIN role
router.post('/switch-org', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { organizationId } = req.body;
  if (!organizationId) {
    res.status(400).json({ error: 'organizationId requerido' });
    return;
  }

  try {
    if (req.user!.role === 'SUPER_ADMIN') {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        res.status(404).json({ error: 'Organización no encontrada' });
        return;
      }

      const token = signToken({
        userId: req.user!.userId,
        organizationId: org.id,
        role: 'SUPER_ADMIN',
        email: req.user!.email,
      });

      const superUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      const allOrgs = await prisma.organization.findMany({ orderBy: { createdAt: 'asc' } });
      const organizations = allOrgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        plan: o.plan,
        role: 'SUPER_ADMIN' as const,
      }));

      res.json({
        token,
        user: { id: req.user!.userId, name: superUser?.name ?? 'Super Admin', email: req.user!.email, role: 'SUPER_ADMIN' },
        organization: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
        organizations,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email: req.user!.email, organizationId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'No tenés acceso a esa organización' });
      return;
    }

    if (!user.organization.isActive) {
      res.status(403).json({ error: 'Esta cuenta está desactivada. Contactá al administrador.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    });

    // Also return all orgs
    const allUserRecords = await prisma.user.findMany({
      where: { email: user.email },
      include: { organization: true },
    });

    const organizations = allUserRecords.map((u) => ({
      id: u.organization.id,
      name: u.organization.name,
      slug: u.organization.slug,
      plan: u.organization.plan,
      role: u.role,
    }));

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
      },
      organizations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(200).json({ message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' });
    return;
  }

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      const token = jwt.sign({ id: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
      const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    }
    // Always return 200 to avoid revealing if email exists
    res.status(200).json({ message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' });
  } catch (err) {
    console.error(err);
    res.status(200).json({ message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Token y contraseña son requeridos' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; purpose: string };
    if (payload.purpose !== 'password-reset') {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: payload.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});

// POST /api/auth/activate
router.post('/activate', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Token y contraseña son requeridos' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; purpose: string };
    if (payload.purpose !== 'activate') {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: payload.id },
      data: { password: hashed, isActive: true },
    });
    res.json({ message: 'Cuenta activada correctamente' });
  } catch {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});

export default router;
