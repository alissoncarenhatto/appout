import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ListFinancialEntryDto } from "./dto/list-financial-entry.dto";

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

  async findAll(user: any, query: ListFinancialEntryDto) {
    const {
      q,
      type,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = query;

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

    if (status === "OVERDUE") {
      where.paidAt = null;
      where.dueDate = { lt: new Date() };
    }

    if (startDate || endDate) {
      where.dueDate = {};

      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    if (user?.role !== "SYSTEM_ADMIN") {
      where.tenantId = this.toBigInt(user?.tenantId);
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.financialEntry.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dueDate: "desc" },
        include: {
          paymentMethod: true,
          account: true,
        },
      }),
      this.prisma.financialEntry.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
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

        accountId: data.accountId ? this.toBigInt(data.accountId) : null,

        tenantId,
      },
    });
  }

  async update(user: any, id: bigint, data: any) {
    const existing = await this.findOne(user, id);

    return this.prisma.financialEntry.update({
      where: { id },
      data: {
        type: data.type ?? existing.type,
        description: data.description ?? existing.description,
        amount: data.amount ?? existing.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
      },
    });
  }

  async pay(user: any, id: bigint, data: any) {
    const existing = await this.findOne(user, id);

    if (existing.paidAt) {
      throw new ForbiddenException("Already paid");
    }

    const accountId = this.toBigInt(data.accountId);

    if (!accountId) {
      throw new ForbiddenException("Account required");
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.financialAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundException("Account not found");
      }

      const newBalance =
        existing.type === "RECEIVABLE"
          ? Number(account.balance) + Number(existing.amount)
          : Number(account.balance) - Number(existing.amount);

      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      await tx.financialTransaction.create({
        data: {
          amount: existing.amount,
          type: existing.type === "RECEIVABLE" ? "CREDIT" : "DEBIT",
          accountId: accountId,
          entryId: existing.id,
          tenantId: existing.tenantId,
        },
      });

      return tx.financialEntry.update({
        where: { id },
        data: {
          paidAt: new Date(),
          accountId: accountId,
          paymentMethodId: data.paymentMethodId
            ? this.toBigInt(data.paymentMethodId)
            : null,
        },
      });
    });
  }

  async remove(user: any, id: bigint) {
    await this.findOne(user, id);

    await this.prisma.financialEntry.delete({
      where: { id },
    });

    return { ok: true };
  }
}
