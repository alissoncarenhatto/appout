import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ServicesCatalogService {
  constructor(private prisma: PrismaService) {}

  async list(user: any) {
    const tenantId = user?.tenantId ?? null;

    return this.prisma.servicecatalog.findMany({
      where: {
        tenantId: tenantId ? BigInt(String(tenantId)) : null,
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(user: any, id: string) {
    const sid = BigInt(id);
    const found = await this.prisma.servicecatalog.findUnique({
      where: { id: sid },
    });

    if (!found) throw new NotFoundException("Service not found");

    const tenantIdReq = user?.tenantId ?? null;
    if (String(found.tenantId) !== String(tenantIdReq)) {
      throw new ForbiddenException("Not allowed");
    }

    return found;
  }

  async create(user: any, dto: any) {
    const tenantId = user?.tenantId ?? null;

    return this.prisma.servicecatalog.create({
      data: {
        tenantId: tenantId ? BigInt(String(tenantId)) : null,
        name: dto.name,
        description: dto.description ?? null,
        defaultPrice: dto.defaultPrice ?? 0,
        defaultDurationMin: dto.defaultDurationMin ?? 60,
        cost: dto.cost ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  async update(user: any, id: string, dto: any) {
    const sid = BigInt(id);

    const target = await this.prisma.servicecatalog.findUnique({
      where: { id: sid },
    });

    if (!target) throw new NotFoundException("Service not found");

    const tenantIdReq = user?.tenantId ?? null;
    if (String(target.tenantId) !== String(tenantIdReq)) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.servicecatalog.update({
      where: { id: sid },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        defaultPrice: dto.defaultPrice ?? undefined,
        defaultDurationMin: dto.defaultDurationMin ?? undefined,
        cost: dto.cost ?? undefined,
        active: typeof dto.active === "boolean" ? dto.active : undefined,
      },
    });
  }

  async remove(user: any, id: string) {
    const sid = BigInt(id);

    const target = await this.prisma.servicecatalog.findUnique({
      where: { id: sid },
    });

    if (!target) throw new NotFoundException("Service not found");

    const tenantIdReq = user?.tenantId ?? null;
    if (String(target.tenantId) !== String(tenantIdReq)) {
      throw new ForbiddenException("Not allowed");
    }

    await this.prisma.servicecatalog.delete({ where: { id: sid } });

    return { ok: true };
  }
}
