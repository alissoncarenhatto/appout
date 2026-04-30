import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ListFinancialEntryDto } from "./dto/list-financial-entry.dto";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { UpdateFinancialEntryDto } from "./dto/update-financial-entry.dto";
import {
  normalizeFinancialEntryStatus,
  normalizeFinancialEntryType,
} from "./dto/financial-entry-input";

@Injectable()
export class FinancialEntriesService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: any) {
    if (!id) return null;
    return BigInt(String(id));
  }

  private toBigIntOrNull(id?: string | number | bigint | null) {
    if (id === null || id === undefined || id === "") return null;
    if (typeof id === "bigint") return id;
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
      customerId,
      vehicleId,
      categoryId,
      accountId,
      paymentMethodId,
      workOrderId,
      type,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = query;

    const normalizedType = type
      ? normalizeFinancialEntryType(type)
      : undefined;
    const normalizedStatus = status
      ? normalizeFinancialEntryStatus(status)
      : undefined;

    const where: any = {};
    const and: any[] = [];
    const workorderWhere: any = {};

    if (q?.trim()) {
      const search = q.trim();

      where.OR = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          paymentMethod: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          account: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          workorder: {
            number: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          workorder: {
            customer: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          workorder: {
            vehicle: {
              plate: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (normalizedType) {
      where.type = normalizedType;
    }

    if (normalizedStatus === "OPEN") {
      and.push({ paidAt: null });
    }

    if (normalizedStatus === "PAID") {
      and.push({ paidAt: { not: null } });
    }

    if (normalizedStatus === "OVERDUE") {
      and.push({ paidAt: null });
      and.push({ dueDate: { lt: new Date() } });
    }

    if (startDate || endDate) {
      const dueDate: any = {};

      if (startDate) dueDate.gte = new Date(startDate);
      if (endDate) dueDate.lte = new Date(endDate);

      and.push({ dueDate });
    }

    if (customerId) {
      workorderWhere.customerId = this.toBigInt(customerId);
    }

    if (vehicleId) {
      workorderWhere.vehicleId = this.toBigInt(vehicleId);
    }

    if (workOrderId) {
      workorderWhere.id = this.toBigInt(workOrderId);
    }

    if (Object.keys(workorderWhere).length > 0) {
      where.workorder = workorderWhere;
    }

    if (categoryId) {
      where.categoryId = this.toBigInt(categoryId);
    }

    if (accountId) {
      where.accountId = this.toBigInt(accountId);
    }

    if (paymentMethodId) {
      where.paymentMethodId = this.toBigInt(paymentMethodId);
    }

    if (and.length > 0) {
      where.AND = and;
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
          category: true,
          paymentMethod: true,
          account: true,
          workorder: {
            include: {
              customer: true,
              vehicle: true,
            },
          },
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
      include: {
        category: true,
        paymentMethod: true,
        account: true,
        workorder: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });

    if (!entry) throw new NotFoundException("Entry not found");

    this.checkTenant(user, entry.tenantId);

    return entry;
  }

  async create(user: any, data: CreateFinancialEntryDto) {
    const tenantId =
      user?.role === "SYSTEM_ADMIN"
        ? this.toBigIntOrNull(data.tenantId)
        : this.toBigInt(user?.tenantId);

    return this.prisma.financialEntry.create({
      data: {
        type: data.type,
        description: data.description ?? null,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        workOrderId: data.workOrderId
          ? this.toBigInt(data.workOrderId)
          : null,
        categoryId: data.categoryId ? this.toBigInt(data.categoryId) : null,

        paymentMethodId: data.paymentMethodId
          ? this.toBigInt(data.paymentMethodId)
          : null,

        accountId: data.accountId ? this.toBigInt(data.accountId) : null,

        tenantId,
      },
    });
  }

  async update(user: any, id: bigint, data: UpdateFinancialEntryDto) {
    const existing = await this.findOne(user, id);

    return this.prisma.financialEntry.update({
      where: { id },
      data: {
        type: data.type ?? existing.type,
        description:
          data.description === undefined ? existing.description : data.description,
        amount: data.amount ?? existing.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
        paidAt:
          data.paidAt === undefined
            ? existing.paidAt
            : data.paidAt
              ? new Date(data.paidAt)
              : null,
        workOrderId:
          data.workOrderId === undefined
            ? existing.workOrderId
            : this.toBigIntOrNull(data.workOrderId),
        categoryId:
          data.categoryId === undefined
            ? existing.categoryId
            : this.toBigIntOrNull(data.categoryId),
        paymentMethodId:
          data.paymentMethodId === undefined
            ? existing.paymentMethodId
            : this.toBigIntOrNull(data.paymentMethodId),
        accountId:
          data.accountId === undefined
            ? existing.accountId
            : this.toBigIntOrNull(data.accountId),
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

      if (
        user?.role !== "SYSTEM_ADMIN" &&
        String(account.tenantId ?? null) !== String(user?.tenantId ?? null)
      ) {
        throw new ForbiddenException("Not allowed");
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
          categoryId:
            data.categoryId !== undefined
              ? this.toBigIntOrNull(data.categoryId)
              : existing.categoryId,
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
