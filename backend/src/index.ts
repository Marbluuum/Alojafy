import app from './app';
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

async function start() {
  // Ensure all organizations with null isActive are set to active (one-time fix)
  await prisma.organization.updateMany({
    where: { isActive: null as unknown as boolean },
    data: { isActive: true },
  });

  app.listen(PORT, () => {
    console.log(`🚀 Alojafy API corriendo en http://localhost:${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch(console.error);
