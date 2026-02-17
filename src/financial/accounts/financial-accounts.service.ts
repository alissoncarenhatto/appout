import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FinancialAccountsService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: any) {
    if (!id) return null;
    return BigInt(String(id));
  }

  private checkTenant(user: any, tenantId: bigint | null) {
    if (user?.role === "SYSTEM_ADMIN") return;

    const userTenant = user?.tenantId ? this.toBigInt(user.tenantId) : null;

    if (String(userTenant) !== String(tenantId ?? null)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  async findAll(user: any) {
    const where: any = {};

    if (user?.role !== "SYSTEM_ADMIN") {
      where.tenantId = this.toBigInt(user?.tenantId);
    }

    return this.prisma.financialAccount.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async findOne(user: any, id: bigint) {
    const acc = await this.prisma.financialAccount.findUnique({
      where: { id },
    });
    if (!acc) throw new NotFoundException("Account not found");

    this.checkTenant(user, acc.tenantId);
    return acc;
  }

  async create(user: any, data: any) {
    const tenantId =
      user?.role === "SYSTEM_ADMIN"
        ? this.toBigInt(data.tenantId)
        : this.toBigInt(user?.tenantId);

    return this.prisma.financialAccount.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance ?? 0,
        tenantId,
      },
    });
  }

  async update(user: any, id: bigint, data: any) {
    const existing = await this.findOne(user, id);

    return this.prisma.financialAccount.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        balance: data.balance ?? existing.balance,
      },
    });
  }

  async remove(user: any, id: bigint) {
    await this.findOne(user, id);

    await this.prisma.financialAccount.delete({ where: { id } });
    return { ok: true };
  }
}
