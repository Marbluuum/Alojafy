import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

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
    res.status(400).json({ error: parsed.error.errors[0].message });
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

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { organization: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
