import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // ROLES
  const roles = [
    { name: "SYSTEM_ADMIN" },
    { name: "TENANT_ADMIN" },
    { name: "TENANT_USER" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  // USER ADMIN
  const passwordHash = await bcrypt.hash("Kle@621fullxj6", 10);
  const systemRole = await prisma.role.findUnique({
    where: { name: "SYSTEM_ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "admin@appout.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@appout.com",
      passwordHash: passwordHash,
      roleId: systemRole?.id ?? 1,
      tenantId: null,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
