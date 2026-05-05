import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type AccountWithDerivedBalance = {
  currentBalance: number;
  movementBalance: number;
};

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

  private toNumber(value: unknown) {
    return Number(value ?? 0);
  }

  private async attachDerivedBalances(user: any, items: any[]) {
    if (items.length === 0) {
      return items as Array<any & AccountWithDerivedBalance>;
    }

    const accountIds = items.map((item) => item.id);

    const where: any = {
      accountId: { in: accountIds },
    };

    if (user?.role !== "SYSTEM_ADMIN") {
      where.tenantId = this.toBigInt(user?.tenantId);
    }

    const entryTotals = await this.prisma.financialEntry.groupBy({
      by: ["accountId", "type"],
      where,
      _sum: { amount: true },
    });

    const movementByAccount = new Map<string, number>();

    for (const row of entryTotals) {
      const accountId = String(row.accountId);
      const amount = this.toNumber(row._sum.amount);
      const signedAmount = row.type === "RECEIVABLE" ? amount : -amount;

      movementByAccount.set(
        accountId,
        (movementByAccount.get(accountId) ?? 0) + signedAmount,
      );
    }

    return items.map((item) => {
      const movementBalance = movementByAccount.get(String(item.id)) ?? 0;

      return {
        ...item,
        movementBalance,
        currentBalance: this.toNumber(item.balance) + movementBalance,
      };
    }) as Array<any & AccountWithDerivedBalance>;
  }

  async findAll(user: any, query: any) {
    const { q, page = 1, pageSize = 10 } = query;

    const where: any = {};

    if (q && q.trim() !== "") {
      where.name = {
        contains: q.trim(),
      };
    }

    const role = (user?.role ?? "").toString();

    if (role !== "SYSTEM_ADMIN") {
      where.tenantId = user?.tenantId ? this.toBigInt(user.tenantId) : null;
    }

    const skip = (page - 1) * pageSize;

    const total = await this.prisma.financialAccount.count({ where });

    const items = await this.prisma.financialAccount.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
    });

    const itemsWithBalance = await this.attachDerivedBalances(user, items);

    return {
      items: itemsWithBalance,
      total,
    };
  }

  async findOne(user: any, id: bigint) {
    const acc = await this.prisma.financialAccount.findUnique({
      where: { id },
    });
    if (!acc) throw new NotFoundException("Account not found");

    this.checkTenant(user, acc.tenantId);

    const [withBalance] = await this.attachDerivedBalances(user, [acc]);
    return withBalance;
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
