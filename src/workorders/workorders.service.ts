import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WorkorderPdfService } from "./workorder-pdf.service";
import { ScheduleWorkorderDto } from "./dto/schedule-workorder.dto";

@Injectable()
export class WorkordersService {
  constructor(
    private prisma: PrismaService,
    private pdfService: WorkorderPdfService,
  ) {}

  private toBig(id: string | number | bigint): bigint {
    if (typeof id === "bigint") return id;
    if (typeof id === "number") return BigInt(id);
    if (/^\d+$/.test(String(id))) return BigInt(String(id));
    throw new NotFoundException("Work order not found");
  }

  private toBigIntOrNull(v?: string | number | bigint | null): bigint | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "bigint") return v;
    return BigInt(String(v));
  }

  async findAll(user: any) {
    const where: any = {};

    if (user?.tenantId) {
      where.tenantId = BigInt(String(user.tenantId));
    }

    return this.prisma.workorder.findMany({
      where,
      orderBy: { id: "desc" },
      include: {
        customer: true,
        vehicle: { include: { brand: true, model: true } },
        workorderpart: { include: { part: true } },
        workorderservice: { include: { servicecatalog: true } },
      },
    });
  }

  async findOne(user: any, id: string | number | bigint) {
    const bid = this.toBig(id);

    const wo = await this.prisma.workorder.findUnique({
      where: { id: bid },
      include: {
        customer: true,
        vehicle: { include: { brand: true, model: true } },
        workorderpart: { include: { part: true } },
        workorderservice: { include: { servicecatalog: true } },
        payment: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    if (!wo) throw new NotFoundException("Work order not found");

    if (user?.tenantId && String(user.tenantId) !== String(wo.tenantId)) {
      throw new NotFoundException("Work order not found");
    }

    return wo;
  }

  async create(
    user: any,
    dto: {
      customerId: string | number;
      vehicleId: string | number;
      notes?: string;
    },
  ) {
    const tenantId = this.toBigIntOrNull(user?.tenantId);

    return this.prisma.workorder.create({
      data: {
        customerId: this.toBig(dto.customerId),
        vehicleId: this.toBig(dto.vehicleId),
        notes: dto.notes ?? null,
        status: "PENDING",
        tenantId,
      },
    });
  }

  async schedule(user: any, dto: ScheduleWorkorderDto) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    const now = new Date();

    if (start < now) {
      throw new BadRequestException("Não é possível agendar no passado");
    }

    if (end <= start) {
      throw new BadRequestException("Horário final inválido");
    }

    let workorderId = dto.workorderId;

    if (!workorderId) {
      if (!dto.customerId || !dto.vehicleId) {
        throw new BadRequestException("Cliente e veículo são obrigatórios");
      }

      const wo = await this.prisma.workorder.create({
        data: {
          customerId: BigInt(dto.customerId),
          vehicleId: BigInt(dto.vehicleId),
          status: "PENDING",
          scheduledAt: start,
          finishedAt: end,
          tenantId: user?.tenantId ? BigInt(user.tenantId) : null,
        },
      });

      return wo;
    }

    return this.prisma.workorder.update({
      where: { id: BigInt(workorderId) },
      data: {
        scheduledAt: start,
        finishedAt: end,
      },
    });
  }

  async start(user: any, id: string | number | bigint) {
    const bid = this.toBig(id);
    await this.findOne(user, bid);

    return this.prisma.workorder.update({
      where: { id: bid },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  async finish(user: any, id: string | number | bigint) {
    const bid = this.toBig(id);

    const workorder = await this.findOne(user, bid);

    const updated = await this.prisma.workorder.update({
      where: { id: bid },
      data: { status: "DONE", finishedAt: new Date() },
      include: {
        customer: true,
        vehicle: true,
        workorderservice: { include: { servicecatalog: true } },
        workorderpart: { include: { part: true } },
      },
    });

    const pdfUrl = await this.pdfService.generate(updated);

    return {
      ...updated,
      pdfUrl,
    };
  }

  async addService(
    user: any,
    id: string | number | bigint,
    body: {
      serviceId: string | number;
      qty?: number;
      unitPrice?: number;
      discount?: number;
    },
  ) {
    const bid = this.toBig(id);
    await this.findOne(user, bid);

    const svcId = this.toBig(body.serviceId);

    const svc = await this.prisma.servicecatalog.findUnique({
      where: { id: svcId },
    });
    if (!svc) throw new NotFoundException("Service not found");

    const qty = body.qty ?? 1;
    const unitPrice =
      typeof body.unitPrice === "number"
        ? body.unitPrice
        : Number(svc.defaultPrice ?? 0);
    const unitCost = Number(svc.cost ?? 0);
    const discount = body.discount ?? 0;

    const created = await this.prisma.workorderservice.create({
      data: {
        workOrderId: bid,
        serviceId: svcId,
        qty,
        unitPrice,
        unitCost,
        discount,
      },
      include: {
        servicecatalog: true,
      },
    });

    return {
      ...created,
      name: created.servicecatalog?.name,
      description: created.servicecatalog?.description,
    };
  }

  async addPart(
    user: any,
    id: string | number | bigint,
    body: {
      partId: string | number;
      qty?: number;
      unitPrice?: number;
      discount?: number;
    },
  ) {
    const bid = this.toBig(id);
    await this.findOne(user, bid);

    const partId = this.toBig(body.partId);

    const part = await this.prisma.part.findUnique({
      where: { id: partId },
    });
    if (!part) throw new NotFoundException("Part not found");

    const qty = body.qty ?? 1;
    const unitPrice =
      typeof body.unitPrice === "number"
        ? body.unitPrice
        : Number(part.price ?? 0);
    const unitCost = Number(part.cost ?? 0);
    const discount = body.discount ?? 0;

    const created = this.prisma.workorderpart.create({
      data: {
        workOrderId: bid,
        partId,
        qty,
        unitPrice,
        unitCost,
        discount,
      },

      include: {
        part: true,
      },
    });

    return {
      ...created,
      name: created.part?.name,
    };
  }

  async totals(user: any, id: string | number | bigint) {
    const bid = this.toBig(id);
    const wo = await this.findOne(user, bid);

    const servicesTotal = wo.workorderservice.reduce((acc, item) => {
      return (
        acc +
        Number(item.unitPrice) * Number(item.qty) -
        Number(item.discount ?? 0)
      );
    }, 0);

    const partsTotal = wo.workorderpart.reduce((acc, item) => {
      return (
        acc +
        Number(item.unitPrice) * Number(item.qty) -
        Number(item.discount ?? 0)
      );
    }, 0);

    return {
      servicesTotal,
      partsTotal,
      total: servicesTotal + partsTotal,
    };
  }

  async findByRange(user: any, from?: string, to?: string) {
    const where: any = {
      scheduledAt: { not: null },
    };

    if (user?.tenantId) {
      where.tenantId = BigInt(user.tenantId);
    }

    if (from || to) {
      where.scheduledAt = {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      };
    }

    return this.prisma.workorder.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async pay(id: bigint, data: any, user: any) {
    const workorder = await this.prisma.workorder.findUnique({
      where: { id },
    });

    if (!workorder) throw new NotFoundException("OS not found");

    const tenantId =
      user?.role === "SYSTEM_ADMIN"
        ? this.toBigIntOrNull(data.tenantId)
        : this.toBigIntOrNull(user?.tenantId);

    const payment = await this.prisma.payment.create({
      data: {
        workOrderId: id,
        paymentMethodId: data.paymentMethodId,
        amount: data.amount,
      },
    });

    const entry = await this.prisma.financialEntry.create({
      data: {
        type: "RECEIVABLE",
        description: `Pagamento OS #${id}`,
        amount: data.amount,
        dueDate: new Date(),
        paidAt: new Date(),

        workorder: {
          connect: { id: id },
        },

        paymentMethod: {
          connect: { id: this.toBigIntOrNull(data.paymentMethodId) },
        },

        tenant: {
          connect: { id: this.toBigIntOrNull(user.tenantId) },
        },
      },
    });

    if (data.financialAccountId) {
      await this.prisma.financialAccount.update({
        where: { id: this.toBigIntOrNull(data.financialAccountId) },
        data: {
          balance: {
            increment: data.amount,
          },
        },
      });
    }

    return { payment, entry };
  }

  async removePayment(user: any, paymentId: string | number | bigint) {
    const id = BigInt(paymentId);

    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        workorder: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    await this.prisma.financialAccount.updateMany({
      where: {},
      data: {
        balance: {
          decrement: Number(payment.amount),
        },
      },
    });

    await this.prisma.financialEntry.deleteMany({
      where: {
        workOrderId: payment.workOrderId,
        amount: payment.amount,
      },
    });

    await this.prisma.payment.delete({
      where: { id },
    });

    return { success: true };
  }

  async update(user: any, id: string, data: any) {
    const bid = this.toBig(id);

    await this.findOne(user, bid);

    return this.prisma.workorder.update({
      where: { id: bid },
      data: {
        customerId: data.customerId ? this.toBig(data.customerId) : undefined,
        vehicleId: data.vehicleId ? this.toBig(data.vehicleId) : undefined,
        notes: data.notes ?? undefined,
        discount:
          data.discount !== undefined ? Number(data.discount) : undefined,
      },
    });
  }
}
