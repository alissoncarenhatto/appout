import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: string | number | bigint | null): bigint | null {
    if (id === null || id === undefined) return null;
    if (typeof id === "bigint") return id;
    return BigInt(String(id));
  }

  async findAll(user: any, query: any) {
    const { q } = query;

    const where: any = {};

    if (q) {
      where.name = { contains: q };
    }

    const role = (user?.role ?? "").toString();

    if (role !== "SYSTEM_ADMIN") {
      where.tenantId = user?.tenantId ? this.toBigInt(user.tenantId) : null;
    }

    const total = await this.prisma.paymentMethod.count({ where });

    const items = await this.prisma.paymentMethod.findMany({
      where,
      orderBy: { name: "asc" },
      take: 200,
    });

    return {
      items,
      total,
    };
  }

  async findOne(user: any, id: bigint) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException("Payment method not found");

    this.checkTenant(user, existing.tenantId);

    return existing;
  }

  async create(user: any, data: any) {
    const role = (user?.role ?? "").toString();

    let tenantIdToSave: bigint | null = null;

    if (role === "SYSTEM_ADMIN") {
      tenantIdToSave = data.tenantId ? this.toBigInt(data.tenantId) : null;
    } else {
      tenantIdToSave = user?.tenantId ? this.toBigInt(user.tenantId) : null;
    }

    return this.prisma.paymentMethod.create({
      data: {
        name: data.name,
        type: data.type,
        active: data.active ?? true,
        allowInstallments: data.allowInstallments ?? false,
        defaultInstallments: data.defaultInstallments ?? null,
        feePercent: data.feePercent ?? 0,
        description: data.description ?? null,
        tenantId: tenantIdToSave,
      },
    });
  }

  async update(user: any, id: bigint, data: any) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException("Payment method not found");

    this.checkTenant(user, existing.tenantId);

    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        active: data.active ?? existing.active,
        allowInstallments: data.allowInstallments ?? existing.allowInstallments,
        defaultInstallments:
          data.defaultInstallments ?? existing.defaultInstallments,
        feePercent: data.feePercent ?? existing.feePercent,
        description: data.description ?? existing.description,
      },
    });
  }

  async remove(user: any, id: bigint) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException("Payment method not found");

    this.checkTenant(user, existing.tenantId);

    await this.prisma.paymentMethod.delete({ where: { id } });

    return { ok: true };
  }

  private checkTenant(user: any, tenantId: bigint | null) {
    const role = (user?.role ?? "").toString();

    if (role === "SYSTEM_ADMIN") return;

    const userTenant = user?.tenantId ? this.toBigInt(user.tenantId) : null;

    if (String(tenantId ?? null) !== String(userTenant)) {
      throw new ForbiddenException("Not allowed");
    }
  }
}
