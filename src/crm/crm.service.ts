import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  crm_activity_type,
  crm_deal_status,
  crm_task_status,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  private toBigInt(value?: string | number | bigint | null) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "bigint") return value;
    return BigInt(String(value));
  }

  private tenantIdFor(user: any, requested?: string | number | bigint | null) {
    const role = (user?.role ?? "").toString();
    if (role === "SYSTEM_ADMIN") return this.toBigInt(requested ?? null);
    const tenantId = this.toBigInt(user?.tenantId ?? null);
    if (!tenantId) throw new ForbiddenException("Tenant not found");
    return tenantId;
  }

  private tenantWhere(user: any) {
    const role = (user?.role ?? "").toString();
    if (role === "SYSTEM_ADMIN") return {};
    return { tenantId: this.tenantIdFor(user) };
  }

  private async assertDealAccess(user: any, dealId: string | number | bigint) {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id: BigInt(String(dealId)) },
    });
    if (!deal) throw new NotFoundException("Deal not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantId = this.tenantIdFor(user);
      if (String(deal.tenantId ?? null) !== String(tenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    return deal;
  }

  async listPipelines(user: any) {
    return this.prisma.crmPipeline.findMany({
      where: this.tenantWhere(user),
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { id: "asc" },
    });
  }

  async createPipeline(user: any, body: any) {
    const tenantId = this.tenantIdFor(user, body?.tenantId);
    const pipeline = await this.prisma.crmPipeline.create({
      data: {
        tenantId,
        name: body.name?.trim() || "Pipeline principal",
        active: body.active ?? true,
      },
    });

    const stageNames = body.stages?.length
      ? body.stages
      : ["Novo", "Contato feito", "Proposta", "Fechado"];

    await this.prisma.crmPipelineStage.createMany({
      data: stageNames.map((stage: any, index: number) => ({
        tenantId,
        pipelineId: pipeline.id,
        name: typeof stage === "string" ? stage : stage.name,
        order: typeof stage === "string" ? index : stage.order ?? index,
        color: typeof stage === "string" ? null : stage.color ?? null,
        isWon:
          typeof stage === "string"
            ? index === stageNames.length - 1
            : stage.isWon ?? false,
        isLost: typeof stage === "string" ? false : stage.isLost ?? false,
      })),
    });

    return this.prisma.crmPipeline.findUnique({
      where: { id: pipeline.id },
      include: { stages: { orderBy: { order: "asc" } } },
    });
  }

  async createStage(user: any, pipelineId: string | number | bigint, body: any) {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id: BigInt(String(pipelineId)) },
    });
    if (!pipeline) throw new NotFoundException("Pipeline not found");

    const tenantId = this.tenantIdFor(user, body?.tenantId ?? pipeline.tenantId);
    if (String(pipeline.tenantId ?? null) !== String(tenantId)) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.crmPipelineStage.create({
      data: {
        tenantId,
        pipelineId: pipeline.id,
        name: body.name?.trim(),
        order: body.order ?? 0,
        color: body.color?.trim() || null,
        isWon: body.isWon ?? false,
        isLost: body.isLost ?? false,
        active: body.active ?? true,
      },
    });
  }

  async listDeals(user: any, query: any) {
    const where: any = this.tenantWhere(user);

    if (query?.status) where.status = query.status;
    if (query?.stageId) where.stageId = this.toBigInt(query.stageId);
    if (query?.customerId) where.customerId = this.toBigInt(query.customerId);
    if (query?.leadId) where.leadId = this.toBigInt(query.leadId);
    if (query?.ownerUserId) where.ownerUserId = this.toBigInt(query.ownerUserId);

    if (query?.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q } },
        { source: { contains: q } },
        { notes: { contains: q } },
        { customer: { name: { contains: q } } },
        { lead: { name: { contains: q } } },
      ];
    }

    return this.prisma.crmDeal.findMany({
      where,
      include: {
        pipeline: true,
        stage: true,
        customer: true,
        lead: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
  }

  async inactiveCustomers(user: any, query: any) {
    const months = Math.min(36, Math.max(1, Number(query?.months ?? 6)));
    const take = Math.min(500, Math.max(1, Number(query?.take ?? 100)));
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const customerWhere: any = this.tenantWhere(user);
    const workorderWhere: any = {
      status: "DONE",
      OR: [{ finishedAt: { not: null } }, { scheduledAt: { not: null } }],
    };

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      workorderWhere.tenantId = this.tenantIdFor(user);
    }

    const customers = await this.prisma.customer.findMany({
      where: customerWhere,
      include: {
        workorder: {
          where: workorderWhere,
          orderBy: [{ finishedAt: "desc" }, { scheduledAt: "desc" }, { id: "desc" }],
          take: 1,
          include: {
            vehicle: { include: { brand: true, model: true } },
            asset: true,
            workorderservice: { include: { servicecatalog: true } },
          },
        },
        _count: {
          select: { workorder: true },
        },
      },
      orderBy: { name: "asc" },
      take: 1000,
    });

    const items = customers
      .map((customer: any) => {
        const lastWorkorder = customer.workorder?.[0] ?? null;
        const lastServiceAt =
          lastWorkorder?.finishedAt ?? lastWorkorder?.scheduledAt ?? null;

        if (!lastServiceAt) return null;

        const lastDate = new Date(lastServiceAt);
        if (Number.isNaN(lastDate.getTime()) || lastDate > cutoff) return null;

        const daysSinceLastService = Math.max(
          0,
          Math.floor((Date.now() - lastDate.getTime()) / 86400000),
        );
        const assetName =
          lastWorkorder.asset?.name ??
          lastWorkorder.asset?.identifier ??
          lastWorkorder.vehicle?.plate ??
          null;
        const serviceNames = (lastWorkorder.workorderservice ?? [])
          .map((item: any) => item.servicecatalog?.name)
          .filter(Boolean);

        return {
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          },
          lastWorkorder: {
            id: lastWorkorder.id,
            finishedAt: lastWorkorder.finishedAt,
            scheduledAt: lastWorkorder.scheduledAt,
            assetName,
            services: serviceNames,
          },
          daysSinceLastService,
          monthsSinceLastService: Math.floor(daysSinceLastService / 30),
          totalWorkorders: customer._count?.workorder ?? 0,
          suggestedAction: "REACTIVATION_CAMPAIGN",
          suggestedMessage: this.buildReactivationMessage(
            customer.name,
            assetName,
            serviceNames[0],
          ),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.daysSinceLastService - a.daysSinceLastService)
      .slice(0, take);

    return {
      campaign: {
        code: "INACTIVE_CUSTOMERS",
        title: `Clientes sem servico ha ${months} meses`,
        description:
          "Sugestao para reativar clientes que ja compraram, mas nao retornaram recentemente.",
        months,
        cutoff,
      },
      total: items.length,
      items,
    };
  }

  private buildReactivationMessage(
    customerName?: string | null,
    assetName?: string | null,
    serviceName?: string | null,
  ) {
    const firstName = String(customerName ?? "tudo bem").trim().split(/\s+/)[0];
    const subject = assetName ? ` do ${assetName}` : "";
    const service = serviceName ? ` desde o ultimo ${serviceName}` : "";
    return `Ola, ${firstName}! Ja faz um tempo${service} que voce nao passa por aqui. Quer agendar uma revisao${subject}?`;
  }

  async findDeal(user: any, id: string | number | bigint) {
    await this.assertDealAccess(user, id);
    return this.prisma.crmDeal.findUnique({
      where: { id: BigInt(String(id)) },
      include: {
        pipeline: true,
        stage: true,
        customer: true,
        lead: true,
        owner: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { happenedAt: "desc" } },
        tasks: { orderBy: { dueAt: "asc" } },
      },
    });
  }

  async createDeal(user: any, body: any) {
    const tenantId = this.tenantIdFor(user, body?.tenantId);
    return this.prisma.crmDeal.create({
      data: {
        tenantId,
        pipelineId: this.toBigInt(body.pipelineId),
        stageId: this.toBigInt(body.stageId),
        customerId: this.toBigInt(body.customerId),
        leadId: this.toBigInt(body.leadId),
        ownerUserId: this.toBigInt(body.ownerUserId ?? user?.sub ?? user?.id),
        title: body.title?.trim(),
        value: body.value ?? 0,
        status: body.status ?? crm_deal_status.OPEN,
        source: body.source?.trim() || null,
        expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
        notes: body.notes?.trim() || null,
      },
    });
  }

  async updateDeal(user: any, id: string | number | bigint, body: any) {
    const deal = await this.assertDealAccess(user, id);
    const status = body.status ?? undefined;
    const closedAt =
      status === crm_deal_status.WON || status === crm_deal_status.LOST
        ? body.closedAt
          ? new Date(body.closedAt)
          : new Date()
        : body.closedAt !== undefined
          ? body.closedAt
            ? new Date(body.closedAt)
            : null
          : undefined;

    return this.prisma.crmDeal.update({
      where: { id: deal.id },
      data: {
        pipelineId:
          body.pipelineId !== undefined ? this.toBigInt(body.pipelineId) : undefined,
        stageId: body.stageId !== undefined ? this.toBigInt(body.stageId) : undefined,
        customerId:
          body.customerId !== undefined ? this.toBigInt(body.customerId) : undefined,
        leadId: body.leadId !== undefined ? this.toBigInt(body.leadId) : undefined,
        ownerUserId:
          body.ownerUserId !== undefined ? this.toBigInt(body.ownerUserId) : undefined,
        title: body.title !== undefined ? body.title?.trim() : undefined,
        value: body.value !== undefined ? body.value : undefined,
        status,
        source: body.source !== undefined ? body.source?.trim() || null : undefined,
        lostReason:
          body.lostReason !== undefined ? body.lostReason?.trim() || null : undefined,
        expectedCloseAt:
          body.expectedCloseAt !== undefined
            ? body.expectedCloseAt
              ? new Date(body.expectedCloseAt)
              : null
            : undefined,
        closedAt,
        notes: body.notes !== undefined ? body.notes?.trim() || null : undefined,
      },
    });
  }

  async createActivity(user: any, body: any) {
    const tenantId = this.tenantIdFor(user, body?.tenantId);
    if (body.dealId) await this.assertDealAccess(user, body.dealId);

    return this.prisma.crmActivity.create({
      data: {
        tenantId,
        dealId: this.toBigInt(body.dealId),
        customerId: this.toBigInt(body.customerId),
        leadId: this.toBigInt(body.leadId),
        userId: this.toBigInt(body.userId ?? user?.sub ?? user?.id),
        type: body.type ?? crm_activity_type.NOTE,
        title: body.title?.trim(),
        description: body.description?.trim() || null,
        happenedAt: body.happenedAt ? new Date(body.happenedAt) : new Date(),
      },
    });
  }

  async listActivities(user: any, query: any) {
    const where: any = this.tenantWhere(user);
    if (query?.dealId) where.dealId = this.toBigInt(query.dealId);
    if (query?.customerId) where.customerId = this.toBigInt(query.customerId);
    if (query?.leadId) where.leadId = this.toBigInt(query.leadId);

    return this.prisma.crmActivity.findMany({
      where,
      include: {
        deal: true,
        customer: true,
        lead: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { happenedAt: "desc" },
      take: 300,
    });
  }

  async createTask(user: any, body: any) {
    const tenantId = this.tenantIdFor(user, body?.tenantId);
    if (body.dealId) await this.assertDealAccess(user, body.dealId);

    return this.prisma.crmTask.create({
      data: {
        tenantId,
        dealId: this.toBigInt(body.dealId),
        customerId: this.toBigInt(body.customerId),
        leadId: this.toBigInt(body.leadId),
        assignedToId: this.toBigInt(body.assignedToId ?? user?.sub ?? user?.id),
        title: body.title?.trim(),
        description: body.description?.trim() || null,
        status: body.status ?? crm_task_status.OPEN,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      },
    });
  }

  async listTasks(user: any, query: any) {
    const where: any = this.tenantWhere(user);
    if (query?.status) where.status = query.status;
    if (query?.dealId) where.dealId = this.toBigInt(query.dealId);
    if (query?.customerId) where.customerId = this.toBigInt(query.customerId);
    if (query?.leadId) where.leadId = this.toBigInt(query.leadId);
    if (query?.assignedToId) where.assignedToId = this.toBigInt(query.assignedToId);

    return this.prisma.crmTask.findMany({
      where,
      include: {
        deal: true,
        customer: true,
        lead: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      take: 300,
    });
  }

  async updateTask(user: any, id: string | number | bigint, body: any) {
    const task = await this.prisma.crmTask.findUnique({
      where: { id: BigInt(String(id)) },
    });
    if (!task) throw new NotFoundException("Task not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantId = this.tenantIdFor(user);
      if (String(task.tenantId ?? null) !== String(tenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const status = body.status ?? undefined;
    const completedAt =
      status === crm_task_status.DONE
        ? body.completedAt
          ? new Date(body.completedAt)
          : new Date()
        : body.completedAt !== undefined
          ? body.completedAt
            ? new Date(body.completedAt)
            : null
          : undefined;

    return this.prisma.crmTask.update({
      where: { id: task.id },
      data: {
        dealId: body.dealId !== undefined ? this.toBigInt(body.dealId) : undefined,
        customerId:
          body.customerId !== undefined ? this.toBigInt(body.customerId) : undefined,
        leadId: body.leadId !== undefined ? this.toBigInt(body.leadId) : undefined,
        assignedToId:
          body.assignedToId !== undefined
            ? this.toBigInt(body.assignedToId)
            : undefined,
        title: body.title !== undefined ? body.title?.trim() : undefined,
        description:
          body.description !== undefined
            ? body.description?.trim() || null
            : undefined,
        status,
        dueAt:
          body.dueAt !== undefined
            ? body.dueAt
              ? new Date(body.dueAt)
              : null
            : undefined,
        completedAt,
      },
    });
  }
}
