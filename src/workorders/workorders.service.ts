import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkordersService {
  constructor(private prisma: PrismaService) {}

  private toBig(id: string | number | bigint): bigint {
    if (typeof id === 'bigint') return id;
    if (typeof id === 'number') return BigInt(id);
    if (typeof id === 'string') {
      const clean = id.trim();
      if (/^\d+$/.test(clean)) {
        return BigInt(clean);
      }
      throw new NotFoundException('Work order not found');
    }
    throw new NotFoundException('Work order not found');
  }

  async findAll() {
    return this.prisma.workorder.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        vehicle: { include: { brand: true, model: true } },
        workorderpart: { include: { part: true } },
        workorderservice: { include: { servicecatalog: true } },
      },
    });
  }

  async findOne(id: string | number | bigint) {
    const bid = this.toBig(id);
    const wo = await this.prisma.workorder.findUnique({
      where: { id: bid },
      include: {
        customer: true,
        vehicle: { include: { brand: true, model: true } },
        workorderpart: { include: { part: true } },
        workorderservice: { include: { servicecatalog: true } },
      },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    return wo;
  }

  async findByRange(from: string, to: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.prisma.workorder.findMany({
      where: {
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        customer: true,
        vehicle: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(dto: { customerId: string | number; vehicleId: string | number; notes?: string }) {
    return this.prisma.workorder.create({
      data: {
        customerId: this.toBig(dto.customerId),
        vehicleId: this.toBig(dto.vehicleId),
        notes: dto.notes ?? null,
        status: 'PENDING',
      },
    });
  }

  async schedule(id: string | number | bigint, body: { scheduledAt: string | null }) {
    const bid = this.toBig(id);
    return this.prisma.workorder.update({
      where: { id: bid },
      data: {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    });
  }

  async start(id: string | number | bigint) {
    const bid = this.toBig(id);
    return this.prisma.workorder.update({
      where: { id: bid },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async finish(id: string | number | bigint) {
    const bid = this.toBig(id);
    return this.prisma.workorder.update({
      where: { id: bid },
      data: {
        status: 'DONE',
        finishedAt: new Date(),
      },
    });
  }

  async addService(
    id: string | number | bigint,
    body: { serviceId: string | number; qty?: number; unitPrice?: number; discount?: number },
  ) {
    const bid = this.toBig(id);
    const svcId = this.toBig(body.serviceId);

    const svc = await this.prisma.servicecatalog.findUnique({
      where: { id: svcId },
    });
    if (!svc) throw new NotFoundException('Service not found');

    const qty = body.qty ?? 1;
    const unitPrice =
      typeof body.unitPrice === 'number'
        ? body.unitPrice
        : Number(svc.defaultPrice ?? 0);
    const unitCost = Number(svc.cost ?? 0);
    const discount = body.discount ?? 0;

    return this.prisma.workorderservice.create({
      data: {
        workOrderId: bid,
        serviceId: svcId,
        qty,
        unitPrice,
        unitCost,
        discount,
      },
    });
  }

  async addPart(
    id: string | number | bigint,
    body: { partId: string | number; qty?: number; unitPrice?: number; discount?: number },
  ) {
    const bid = this.toBig(id);
    const partId = this.toBig(body.partId);

    const part = await this.prisma.part.findUnique({
      where: { id: partId },
    });
    if (!part) throw new NotFoundException('Part not found');

    const qty = body.qty ?? 1;
    const unitPrice =
      typeof body.unitPrice === 'number'
        ? body.unitPrice
        : Number(part.price ?? 0);
    const unitCost = Number(part.cost ?? 0);
    const discount = body.discount ?? 0;

    return this.prisma.workorderpart.create({
      data: {
        workOrderId: bid,
        partId,
        qty,
        unitPrice,
        unitCost,
        discount,
      },
    });
  }

  async totals(id: string | number | bigint) {
    const bid = this.toBig(id);
    const wo = await this.prisma.workorder.findUnique({
      where: { id: bid },
      include: {
        workorderservice: true,
        workorderpart: true,
      },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const servicesTotal = wo.workorderservice.reduce((acc, item) => {
      const up = Number(item.unitPrice ?? 0);
      const qty = Number(item.qty ?? 1);
      const disc = Number(item.discount ?? 0);
      return acc + up * qty - disc;
    }, 0);

    const partsTotal = wo.workorderpart.reduce((acc, item) => {
      const up = Number(item.unitPrice ?? 0);
      const qty = Number(item.qty ?? 1);
      const disc = Number(item.discount ?? 0);
      return acc + up * qty - disc;
    }, 0);

    return {
      servicesTotal,
      partsTotal,
      total: servicesTotal + partsTotal,
    };
  }
}
