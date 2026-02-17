import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FinancialEntriesService {
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

  async findAll(user: any, query: any) {
    const { q, type, status, page = 1, pageSize = 10 } = query;

    const where: any = {};

    if (q) {
      where.description = {
        contains: q,
      };
    }

    if (type) {
      where.type = type;
    }

    if (status === "OPEN") {
      where.paidAt = null;
    }

    if (status === "PAID") {
      where.paidAt = { not: null };
    }

    if (user?.role !== "SYSTEM_ADMIN") {
      where.tenantId = this.toBigInt(user?.tenantId);
    }

    const skip = (page - 1) * pageSize;

    const total = await this.prisma.financialEntry.count({ where });

    const items = await this.prisma.financialEntry.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { dueDate: "desc" },
    });

    return { items, total };
  }

  async findOne(user: any, id: bigint) {
    const entry = await this.prisma.financialEntry.findUnique({
      where: { id },
    });

    if (!entry) throw new NotFoundException("Entry not found");

    this.checkTenant(user, entry.tenantId);

    return entry;
  }

  async create(user: any, data: any) {
    const tenantId =
      user?.role === "SYSTEM_ADMIN"
        ? this.toBigInt(data.tenantId)
        : this.toBigInt(user?.tenantId);

    return this.prisma.financialEntry.create({
      data: {
        type: data.type,
        description: data.description ?? null,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        paymentMethodId: data.paymentMethodId
          ? this.toBigInt(data.paymentMethodId)
          : null,
        tenantId,
      },
    });
  }

  async update(user: any, id: bigint, data: any) {
    const existing = await this.findOne(user, id);

    return this.prisma.financialEntry.update({
      where: { id },
      data: {
        description: data.description ?? existing.description,
        amount: data.amount ?? existing.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
      },
    });
  }

  async pay(user: any, id: bigint, data: any) {
    const existing = await this.findOne(user, id);

    if (existing.paidAt) throw new ForbiddenException("Already paid");

    if (data.accountId) {
      const accountId = this.toBigInt(data.accountId);

      const account = await this.prisma.financialAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) throw new NotFoundException("Account not found");

      const newBalance =
        existing.type === "RECEIVABLE"
          ? Number(account.balance) + Number(existing.amount)
          : Number(account.balance) - Number(existing.amount);

      await this.prisma.financialAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });
    }

    return this.prisma.financialEntry.update({
      where: { id },
      data: {
        paidAt: new Date(),
      },
    });
  }

  async remove(user: any, id: bigint) {
    await this.findOne(user, id);

    await this.prisma.financialEntry.delete({ where: { id } });

    return { ok: true };
  }
}
