import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FinancialDashboardService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: any) {
    if (!id) return null;
    return BigInt(String(id));
  }

  async getDashboard(user: any, query: any) {
    const tenantId =
      user?.role === "SYSTEM_ADMIN" ? undefined : this.toBigInt(user?.tenantId);

    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (query.startDate || query.endDate) {
      where.dueDate = {};

      if (query.startDate) where.dueDate.gte = new Date(query.startDate);
      if (query.endDate) where.dueDate.lte = new Date(query.endDate);
    }

    const today = new Date();

    const [receivable, payable, openEntries, overdue, totalEntries] =
      await this.prisma.$transaction([
        this.prisma.financialEntry.aggregate({
          where: {
            ...where,
            type: "RECEIVABLE",
            paidAt: { not: null },
          },
          _sum: { amount: true },
        }),

        this.prisma.financialEntry.aggregate({
          where: {
            ...where,
            type: "PAYABLE",
            paidAt: { not: null },
          },
          _sum: { amount: true },
        }),

        this.prisma.financialEntry.count({
          where: {
            ...where,
            paidAt: null,
          },
        }),

        this.prisma.financialEntry.count({
          where: {
            ...where,
            paidAt: null,
            dueDate: { lt: today },
          },
        }),

        this.prisma.financialEntry.count({
          where,
        }),
      ]);

    const revenue = Number(receivable._sum.amount ?? 0);
    const expenses = Number(payable._sum.amount ?? 0);
    const profit = revenue - expenses;

    const avgTicket = totalEntries ? revenue / totalEntries : 0;

    return {
      revenue,
      expenses,
      profit,
      avgTicket,
      totalEntries,
      openEntries,
      overdue,
    };
  }
}
