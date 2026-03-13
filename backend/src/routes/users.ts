import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sendActivationEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireAdmin);

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// GET /api/users — listar usuarios de la organización
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/users — invitar/crear usuario en la organización
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await prisma.user.findFirst({
      where: { email, organizationId: req.user!.organizationId },
    });

    if (existing) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email en esta organización' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        organizationId: req.user!.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // No puede modificar su propio rol o estado
    if (existing.id === req.user!.userId && (parsed.data.role !== undefined || parsed.data.isActive !== undefined)) {
      res.status(400).json({ error: 'No podés modificar tu propio rol o estado' });
      return;
    }

    const { password, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// POST /api/users/:id/send-activation
router.post('/:id/send-activation', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
      include: { organization: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const token = jwt.sign({ id: user.id, purpose: 'activate' }, JWT_SECRET, { expiresIn: '72h' });
    const activationLink = `${FRONTEND_URL}/activate?token=${token}`;
    await sendActivationEmail(user.email, user.name, activationLink, user.organization.name);

    res.json({ message: 'Email de activación enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar email de activación' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id as string === req.user!.userId) {
      res.status(400).json({ error: 'No podés eliminar tu propia cuenta' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { id: req.params.id as string, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
