import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { estimate_item_type, estimate_status } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkorderPdfService } from "../workorders/workorder-pdf.service";

@Injectable()
export class EstimatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: WorkorderPdfService,
  ) {}

  private toBigInt(value?: string | number | bigint | null) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "bigint") return value;
    return BigInt(String(value));
  }

  private tenantIdFor(user: any, requested?: string | number | bigint | null) {
    const role = (user?.role ?? "").toString();
    if (role === "SYSTEM_ADMIN") return this.toBigInt(requested ?? null);
    return this.toBigInt(user?.tenantId ?? null);
  }

  private tenantWhere(user: any) {
    const role = (user?.role ?? "").toString();
    if (role === "SYSTEM_ADMIN") return {};
    return { tenantId: this.tenantIdFor(user) };
  }

  private assertAccess(user: any, estimate: { tenantId: bigint | null }) {
    const role = (user?.role ?? "").toString();
    if (role === "SYSTEM_ADMIN") return;
    const tenantId = this.tenantIdFor(user);
    if (String(estimate.tenantId ?? null) !== String(tenantId)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private includeFull() {
    return {
      tenant: true,
      customer: true,
      vehicle: { include: { brand: true, model: true } },
      items: {
        include: { service: true, part: true },
        orderBy: { id: "asc" as const },
      },
    };
  }

  async list(user: any, query: any) {
    const where: any = this.tenantWhere(user);

    if (query?.status) where.status = query.status;
    if (query?.customerId) where.customerId = this.toBigInt(query.customerId);

    if (query?.q?.trim()) {
      const q = String(query.q).trim();
      where.OR = [
        { number: { contains: q } },
        { title: { contains: q } },
        { notes: { contains: q } },
        { customer: { name: { contains: q } } },
      ];
    }

    return this.prisma.estimate.findMany({
      where,
      include: this.includeFull(),
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
  }

  async findOne(user: any, id: string | number | bigint) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: BigInt(String(id)) },
      include: this.includeFull(),
    });
    if (!estimate) throw new NotFoundException("Estimate not found");
    this.assertAccess(user, estimate);
    return estimate;
  }

  async create(user: any, body: any) {
    const tenantId = this.tenantIdFor(user, body?.tenantId);
    const estimate = await this.prisma.estimate.create({
      data: {
        tenantId,
        customerId: BigInt(String(body.customerId)),
        vehicleId: this.toBigInt(body.vehicleId),
        title: body.title?.trim() || null,
        notes: body.notes?.trim() || null,
        discount: Number(body.discount ?? 0),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
      },
    });

    return this.findOne(user, estimate.id);
  }

  async update(user: any, id: string | number | bigint, body: any) {
    const current = await this.findOne(user, id);
    await this.prisma.estimate.update({
      where: { id: current.id },
      data: {
        customerId:
          body.customerId !== undefined
            ? BigInt(String(body.customerId))
            : undefined,
        vehicleId:
          body.vehicleId !== undefined ? this.toBigInt(body.vehicleId) : undefined,
        title: body.title !== undefined ? body.title?.trim() || null : undefined,
        notes: body.notes !== undefined ? body.notes?.trim() || null : undefined,
        discount:
          body.discount !== undefined ? Number(body.discount ?? 0) : undefined,
        validUntil:
          body.validUntil !== undefined
            ? body.validUntil
              ? new Date(body.validUntil)
              : null
            : undefined,
      },
    });

    await this.recalculateTotals(current.id);
    return this.findOne(user, current.id);
  }

  async addItem(user: any, id: string | number | bigint, body: any) {
    const estimate = await this.findOne(user, id);
    const type = (body.type ?? "CUSTOM") as estimate_item_type;
    const qty = Number(body.qty ?? 1);
    let description = body.description?.trim() || "";
    let unitPrice = Number(body.unitPrice ?? 0);
    let unitCost = Number(body.unitCost ?? 0);
    let serviceId: bigint | null = null;
    let partId: bigint | null = null;

    if (type === "SERVICE") {
      serviceId = this.toBigInt(body.serviceId);
      if (!serviceId) throw new BadRequestException("Service is required");
      const service = await this.prisma.servicecatalog.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw new NotFoundException("Service not found");
      description = description || service.name;
      unitPrice = body.unitPrice !== undefined ? unitPrice : Number(service.defaultPrice);
      unitCost = body.unitCost !== undefined ? unitCost : Number(service.cost ?? 0);
    }

    if (type === "PART") {
      partId = this.toBigInt(body.partId);
      if (!partId) throw new BadRequestException("Part is required");
      const part = await this.prisma.part.findUnique({ where: { id: partId } });
      if (!part) throw new NotFoundException("Part not found");
      description = description || part.name;
      unitPrice = body.unitPrice !== undefined ? unitPrice : Number(part.price);
      unitCost = body.unitCost !== undefined ? unitCost : Number(part.cost ?? 0);
    }

    if (!description) throw new BadRequestException("Description is required");

    const discount = Number(body.discount ?? 0);
    const total = qty * unitPrice - discount;

    await this.prisma.estimateItem.create({
      data: {
        estimateId: estimate.id,
        tenantId: estimate.tenantId,
        type,
        serviceId,
        partId,
        description,
        qty,
        unitPrice,
        unitCost,
        discount,
        total,
      },
    });

    await this.recalculateTotals(estimate.id);
    return this.findOne(user, estimate.id);
  }

  async replaceItems(user: any, id: string | number | bigint, items: any[]) {
    const estimate = await this.findOne(user, id);
    if (!Array.isArray(items) || !items.length) {
      throw new BadRequestException("Estimate must have at least one item");
    }

    const normalized: any[] = [];
    for (const body of items) {
      const type = (body.type ?? "CUSTOM") as estimate_item_type;
      const qty = Math.max(1, Number(body.qty ?? 1));
      const unitPrice = Math.max(0, Number(body.unitPrice ?? 0));
      const unitCost = Math.max(0, Number(body.unitCost ?? 0));
      const discount = Math.max(0, Number(body.discount ?? 0));
      let description = body.description?.trim() || "";
      let serviceId: bigint | null = null;
      let partId: bigint | null = null;

      if (type === "SERVICE") {
        serviceId = this.toBigInt(body.serviceId);
        if (!serviceId) throw new BadRequestException("Service is required");
        const service = await this.prisma.servicecatalog.findUnique({ where: { id: serviceId } });
        if (!service) throw new NotFoundException("Service not found");
        description = description || service.name;
      }

      if (type === "PART") {
        partId = this.toBigInt(body.partId);
        if (!partId) throw new BadRequestException("Part is required");
        const part = await this.prisma.part.findUnique({ where: { id: partId } });
        if (!part) throw new NotFoundException("Part not found");
        description = description || part.name;
      }

      if (!description) throw new BadRequestException("Description is required");
      normalized.push({
        estimateId: estimate.id,
        tenantId: estimate.tenantId,
        type,
        serviceId,
        partId,
        description,
        qty,
        unitPrice,
        unitCost,
        discount,
        total: qty * unitPrice - discount,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.estimateItem.deleteMany({ where: { estimateId: estimate.id } });
      for (const data of normalized) await tx.estimateItem.create({ data });
    });

    await this.recalculateTotals(estimate.id);
    const updated = await this.findOne(user, estimate.id);
    if (updated.status === "SENT") {
      const pdfUrl = await this.pdfService.generate(updated, user, "estimate");
      return { ...updated, pdfUrl };
    }
    return updated;
  }
  async removeItem(user: any, id: string | number | bigint, itemId: string) {
    const estimate = await this.findOne(user, id);
    await this.prisma.estimateItem.deleteMany({
      where: { id: BigInt(String(itemId)), estimateId: estimate.id },
    });
    await this.recalculateTotals(estimate.id);
    return this.findOne(user, estimate.id);
  }

  async setStatus(
    user: any,
    id: string | number | bigint,
    status: estimate_status,
  ) {
    const estimate = await this.findOne(user, id);
    const now = new Date();
    const data: any = { status };

    if (status === "SENT") data.sentAt = estimate.sentAt ?? now;
    if (status === "APPROVED") data.approvedAt = now;
    if (status === "REJECTED") data.rejectedAt = now;

    await this.prisma.estimate.update({ where: { id: estimate.id }, data });
    const updated = await this.findOne(user, estimate.id);

    if (status === "SENT") {
      const pdfUrl = await this.pdfService.generate(updated, user, "estimate");
      return { ...updated, pdfUrl };
    }

    return updated;
  }

  async convertToWorkorder(user: any, id: string | number | bigint) {
    const estimate = await this.findOne(user, id);
    if (!estimate.items.length) {
      throw new BadRequestException("Estimate has no items");
    }

    const workorder = await this.prisma.workorder.create({
      data: {
        customerId: estimate.customerId,
        vehicleId: estimate.vehicleId,
        tenantId: estimate.tenantId,
        notes: estimate.notes,
        discount: estimate.discount,
        status: "PENDING",
      },
    });

    for (const item of estimate.items) {
      if (item.type === "SERVICE" && item.serviceId) {
        await this.prisma.workorderservice.create({
          data: {
            workOrderId: workorder.id,
            serviceId: item.serviceId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            discount: item.discount,
            tenantId: estimate.tenantId,
          },
        });
      }

      if (item.type === "PART" && item.partId) {
        await this.prisma.workorderpart.create({
          data: {
            workOrderId: workorder.id,
            partId: item.partId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            discount: item.discount,
            tenantId: estimate.tenantId,
          },
        });
      }
    }

    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    return { workorderId: workorder.id, estimateId: estimate.id };
  }

  async pendingCampaign(user: any, query: any) {
    const days = Math.min(90, Math.max(1, Number(query?.days ?? 7)));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const where: any = {
      ...this.tenantWhere(user),
      status: "SENT",
      sentAt: { lte: cutoff },
    };

    const items = await this.prisma.estimate.findMany({
      where,
      include: this.includeFull(),
      orderBy: { sentAt: "asc" },
      take: 200,
    });

    return {
      campaign: {
        code: "PENDING_ESTIMATES",
        title: `Orcamentos sem resposta ha ${days} dias`,
        description:
          "Sugestao para recuperar orcamentos enviados que ainda nao foram aprovados ou recusados.",
        days,
        cutoff,
      },
      total: items.length,
      items: items.map((estimate: any) => ({
        estimate,
        daysSinceSent: estimate.sentAt
          ? Math.floor((Date.now() - new Date(estimate.sentAt).getTime()) / 86400000)
          : null,
        suggestedMessage: this.buildEstimateFollowupMessage(estimate),
      })),
    };
  }

  private async recalculateTotals(estimateId: bigint) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { items: true },
    });
    if (!estimate) return;

    const subtotal = estimate.items.reduce(
      (sum, item) => sum + Number(item.total ?? 0),
      0,
    );
    const discount = Number(estimate.discount ?? 0);
    const total = Math.max(0, subtotal - discount);

    await this.prisma.estimate.update({
      where: { id: estimateId },
      data: { subtotal, total },
    });
  }

  private buildEstimateFollowupMessage(estimate: any) {
    const firstName = String(estimate.customer?.name ?? "tudo bem")
      .trim()
      .split(/\s+/)[0];
    const total = Number(estimate.total ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return `Ola, ${firstName}! Passando para saber se ficou alguma duvida sobre o orcamento de ${total}. Posso te ajudar a aprovar e agendar?`;
  }
}
