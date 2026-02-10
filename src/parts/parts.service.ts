import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  private toBigIntOrNull(v?: string | number | null) {
    if (v == null) return null;
    const s = String(v);
    if (!s) return null;
    return BigInt(s);
  }

  async list(user: any, q?: string) {
    const tenantId = user?.tenantId ?? null;

    const where: any = {
      active: true,
      tenantId: this.toBigIntOrNull(tenantId),
    };

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
    const tenantId = user?.tenantId ?? null;

    return this.prisma.part.create({
      data: {
        tenantId: this.toBigIntOrNull(tenantId),
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
        name: data.name !== undefined ? data.name : undefined,
        description:
          data.description !== undefined
            ? (data.description ?? null)
            : undefined,
        sku: data.sku !== undefined ? (data.sku ?? null) : undefined,
        price: data.price !== undefined ? (data.price ?? 0) : undefined,
        cost: data.cost !== undefined ? (data.cost ?? 0) : undefined,
        stockQty:
          data.stockQty !== undefined ? (data.stockQty ?? 0) : undefined,
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

    const tenantIdReq = user?.tenantId ?? null;

    if (!part || String(part.tenantId) !== String(tenantIdReq)) {
      throw new ForbiddenException("Access denied");
    }
  }
}
