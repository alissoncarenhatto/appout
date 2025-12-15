import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  async list(user: any, q?: string) {
    const where: any = {
      active: true,
    };

    if (user?.tenantId) {
      where.tenantId = BigInt(String(user.tenantId));
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.part.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  create(user: any, data: any) {
    return this.prisma.part.create({
      data: {
        tenantId: BigInt(user.tenantId),
        name: data.name,
        description: data.description ?? null,
        sku: data.sku ?? null,
        price: data.price ?? 0,
        cost: data.cost ?? 0,
        stockQty: data.stockQty ?? 0,
        active: data.active ?? true,
      },
    });
  }

  async update(user: any, id: string, data: any) {
    await this.ensureTenantAccess(user, id);

    return this.prisma.part.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        description: data.description ?? null,
        sku: data.sku ?? null,
        price: data.price ?? 0,
        cost: data.cost ?? 0,
        stockQty: data.stockQty ?? 0,
        active: typeof data.active === "boolean" ? data.active : undefined,
      },
    });
  }

  async adjustStock(user: any, id: string, delta: number) {
    await this.ensureTenantAccess(user, id);

    return this.prisma.part.update({
      where: { id: BigInt(id) },
      data: {
        stockQty: {
          increment: delta,
        },
      },
    });
  }

  private async ensureTenantAccess(user: any, id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id: BigInt(id) },
      select: { tenantId: true },
    });

    if (!part || part.tenantId !== BigInt(user.tenantId)) {
      throw new ForbiddenException("Access denied");
    }
  }
}
