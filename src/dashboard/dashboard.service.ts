import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface DashboardFilter {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: any, filter: DashboardFilter) {
    const tenantId = BigInt(String(user?.tenantId));

    if (!tenantId) {
      throw new ForbiddenException("User without tenant");
    }

    const startDate = filter.startDate
      ? this.parseLocalDate(filter.startDate, false)
      : null;
    const endDate = filter.endDate
      ? this.parseLocalDate(filter.endDate, true)
      : null;

    const paymentDateFilter =
      startDate && endDate
        ? {
            receivedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const financialDateFilter =
      startDate && endDate
        ? {
            paidAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const workorderDateFilter =
      startDate && endDate
        ? {
            finishedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const now = new Date();

    const [
      statusCounts,
      futureScheduled,
      unscheduled,
      doneOrdersForRevenue,
      payments,
      financialEntries,
      topServicesRaw,
      topPartsRaw,
      topCustomersRaw,
      lastOrdersRaw,
      nextSchedulesRaw,
    ] = await Promise.all([
      // STATUS
      this.prisma.workorder.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { tenantId },
      }),

      // OS FUTURAS
      this.prisma.workorder.count({
        where: {
          tenantId,
          scheduledAt: { gt: now },
        },
      }),

      // SEM AGENDAMENTO
      this.prisma.workorder.count({
        where: {
          tenantId,
          scheduledAt: null,
        },
      }),

      // PAGAMENTOS RECEBIDOS
      this.prisma.workorder.findMany({
        where: {
          tenantId,
          status: "DONE",
          ...workorderDateFilter,
        },
        include: {
          workorderservice: true,
          workorderpart: true,
        },
      }),

      // PAGAMENTOS RECEBIDOS
      this.prisma.payment.findMany({
        where: {
          workorder: { tenantId },
          ...paymentDateFilter,
        },
      }),

      // ENTRADAS / SAÍDAS
      this.prisma.financialEntry.findMany({
        where: {
          tenantId,
          ...financialDateFilter,
        },
      }),

      // TOP SERVIÇOS
      this.prisma.workorderservice.groupBy({
        by: ["serviceId"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 3,
      }),

      // TOP PEÇAS
      this.prisma.workorderpart.groupBy({
        by: ["partId"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 3,
      }),

      // TOP CLIENTES
      this.prisma.workorder.groupBy({
        by: ["customerId"],
        _count: { customerId: true },
        orderBy: { _count: { customerId: "desc" } },
        take: 3,
      }),

      // ÚLTIMAS OS
      this.prisma.workorder.findMany({
        where: {
          tenantId,
          status: "DONE",
        },
        orderBy: {
          finishedAt: "desc",
        },
        take: 5,
        include: {
          customer: true,
          workorderservice: true,
          workorderpart: true,
        },
      }),

      // PRÓXIMOS AGENDAMENTOS
      this.prisma.workorder.findMany({
        where: {
          tenantId,
          scheduledAt: { gt: now },
        },
        orderBy: {
          scheduledAt: "asc",
        },
        take: 5,
        include: {
          customer: true,
          vehicle: true,
        },
      }),
    ]);

    // STATUS

    const status = {
      pending: 0,
      inProgress: 0,
      done: 0,
      canceled: 0,
    };

    statusCounts.forEach((s) => {
      if (s.status === "PENDING") status.pending = s._count.status;
      if (s.status === "IN_PROGRESS") status.inProgress = s._count.status;
      if (s.status === "DONE") status.done = s._count.status;
      if (s.status === "CANCELED") status.canceled = s._count.status;
    });

    const totalWorkOrders =
      status.pending + status.inProgress + status.done + status.canceled;

    // FATURAMENTO (OS concluídas)

    let totalRevenue = 0;
    const revenueMap = new Map<string, number>();

    doneOrdersForRevenue.forEach((order) => {
      const servicesTotal = order.workorderservice.reduce(
        (sum, item) =>
          sum +
          Number(item.unitPrice ?? 0) * Number(item.qty ?? 0) -
          Number(item.discount ?? 0),
        0,
      );

      const partsTotal = order.workorderpart.reduce(
        (sum, item) =>
          sum +
          Number(item.unitPrice ?? 0) * Number(item.qty ?? 0) -
          Number(item.discount ?? 0),
        0,
      );

      const value =
        servicesTotal + partsTotal - Number(order.discount ?? 0);

      totalRevenue += value;

      const date = this.formatLocalDate(order.finishedAt);
      if (!date) return;

      if (!revenueMap.has(date)) {
        revenueMap.set(date, 0);
      }

      revenueMap.set(date, revenueMap.get(date)! + value);
    });

    const revenuePerDay = Array.from(revenueMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const ticketAverage =
      doneOrdersForRevenue.length > 0
        ? totalRevenue / doneOrdersForRevenue.length
        : 0;

    // CRESCIMENTO

    let revenueGrowth = 0;

    if (revenuePerDay.length >= 2) {
      const last = revenuePerDay[revenuePerDay.length - 1].total;
      const prev = revenuePerDay[revenuePerDay.length - 2].total;

      revenueGrowth = prev ? ((last - prev) / prev) * 100 : 0;
    }

    // FINANCEIRO

    let cashIn = 0;
    let cashOut = 0;

    financialEntries.forEach((entry) => {
      const value = Number(entry.amount);

      if (entry.type === "RECEIVABLE") cashIn += value;
      if (entry.type === "PAYABLE") cashOut += value;
    });

    const cashBalance = cashIn - cashOut;

    // TOP SERVIÇOS

    const serviceIds = topServicesRaw.map((s) => s.serviceId);

    const services = await this.prisma.servicecatalog.findMany({
      where: { id: { in: serviceIds } },
    });

    const topServices = topServicesRaw.map((s) => {
      const svc = services.find((x) => x.id === s.serviceId);

      return {
        name: svc?.name ?? "N/A",
        qty: Number(s._sum.qty ?? 0),
      };
    });

    // TOP PEÇAS

    const partIds = topPartsRaw.map((p) => p.partId);

    const parts = await this.prisma.part.findMany({
      where: { id: { in: partIds } },
    });

    const topParts = topPartsRaw.map((p) => {
      const part = parts.find((x) => x.id === p.partId);

      return {
        name: part?.name ?? "N/A",
        qty: Number(p._sum.qty ?? 0),
      };
    });

    // TOP CLIENTES

    const customerIds = topCustomersRaw.map((c) => c.customerId);

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
    });

    const topCustomers = topCustomersRaw.map((c) => {
      const cust = customers.find((x) => x.id === c.customerId);

      return {
        name: cust?.name ?? "N/A",
        totalOrders: c._count.customerId,
      };
    });

    // ÚLTIMAS OS

    const lastOrders = lastOrdersRaw.map((o) => {
      const servicesTotal = o.workorderservice.reduce(
        (sum, s) => sum + Number(s.unitPrice) * Number(s.qty),
        0,
      );

      const partsTotal = o.workorderpart.reduce(
        (sum, p) => sum + Number(p.unitPrice) * Number(p.qty),
        0,
      );

      return {
        id: Number(o.id),
        customer: o.customer?.name ?? "Cliente",
        total: servicesTotal + partsTotal,
        date: this.formatLocalDate(o.finishedAt),
      };
    });

    // AGENDA

    const nextSchedules = nextSchedulesRaw.map((o) => ({
      date: this.formatLocalDate(o.scheduledAt),
      customer: o.customer?.name ?? "",
      vehicle: o.vehicle?.plate ?? "",
    }));

    return {
      totals: {
        totalWorkOrders,
        totalRevenue,
        ticketAverage,

        cashIn,
        cashOut,
        cashBalance,
      },

      status,

      schedule: {
        future: futureScheduled,
        unscheduled,
      },

      revenuePerDay,
      revenueGrowth,

      rankings: {
        topServices,
        topParts,
        topCustomers,
      },

      lastOrders,
      nextSchedules,
    };
  }

  private parseLocalDate(value: string, endOfDay: boolean) {
    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
      return new Date(value);
    }

    if (endOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private formatLocalDate(value?: Date | string | null) {
    if (!value) return undefined;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
