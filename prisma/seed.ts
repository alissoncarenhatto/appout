import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@local.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@local.com', passwordHash, role: 'ADMIN' },
  })

}

main().finally(()=> prisma.$disconnect())
