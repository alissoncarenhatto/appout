import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  private toBigIntOrNull(v?: string | null) {
    if (v == null) return null;
    const s = String(v);
    if (!s) return null;
    return BigInt(s);
  }

  private async setOwnersInternal(vehicleId: bigint, customers?: string[]) {
    await this.prisma.customervehicle.deleteMany({ where: { vehicleId } });
    const ids = (customers ?? []).map((x) => BigInt(String(x)));
    if (!ids.length) return;
    await this.prisma.customervehicle.createMany({
      data: ids.map((customerId) => ({ vehicleId, customerId })),
      skipDuplicates: true,
    });
  }

  async list(user?: any) {
    const where: any = {};
    const role = (user?.role ?? "").toString();

    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      const tenantId = user?.tenantId ?? null;
      where.tenantId = tenantId ? BigInt(String(tenantId)) : null;
    }

    return this.prisma.vehicle.findMany({
      where,
      include: {
        brand: true,
        model: true,
        customervehicle: { include: { customer: true } },
      },
      orderBy: { id: "desc" },
    });
  }

  async get(user: any, id: string) {
    const vid = BigInt(id);
    const found = await this.prisma.vehicle.findUnique({
      where: { id: vid },
      include: {
        brand: true,
        model: true,
        customervehicle: { include: { customer: true } },
      },
    });
    if (!found) throw new NotFoundException("Vehicle not found");

    const role = (user?.role ?? "").toString();
    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      const tenantIdReq = user?.tenantId ?? null;
      const tenantIdTarget = found.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    return found;
  }

  async create(user: any, dto: CreateVehicleDto) {
    const role = (user?.role ?? "").toString();
    let tenantId = dto.tenantId ?? null;

    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      tenantId = user?.tenantId ?? null;
    }

    const created = await this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        brandId: this.toBigIntOrNull(dto.brandId),
        modelId: this.toBigIntOrNull(dto.modelId),
        year: dto.year ?? null,
        imageUrl: dto.imageUrl ?? null,
        tenantId: tenantId ? BigInt(String(tenantId)) : null,
      },
    });

    if (dto.customers?.length) {
      await this.setOwnersInternal(created.id, dto.customers);
    }

    return this.get(user, String(created.id));
  }

  async update(user: any, id: string, dto: UpdateVehicleDto) {
    const vid = BigInt(id);
    const target = await this.prisma.vehicle.findUnique({ where: { id: vid } });
    if (!target) throw new NotFoundException("Vehicle not found");

    const role = (user?.role ?? "").toString();

    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      const tenantIdReq = user?.tenantId ?? null;
      const tenantIdTarget = target.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }

      dto.tenantId = tenantIdTarget;
    }

    await this.prisma.vehicle.update({
      where: { id: vid },
      data: {
        plate: dto.plate !== undefined ? dto.plate : undefined,
        brandId:
          dto.brandId !== undefined
            ? this.toBigIntOrNull(dto.brandId)
            : undefined,
        modelId:
          dto.modelId !== undefined
            ? this.toBigIntOrNull(dto.modelId)
            : undefined,
        year: dto.year !== undefined ? dto.year : undefined,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : undefined,
        tenantId:
          dto.tenantId !== undefined
            ? dto.tenantId
              ? BigInt(String(dto.tenantId))
              : null
            : undefined,
      },
    });

    if (dto.customers) {
      await this.setOwnersInternal(vid, dto.customers);
    }

    return this.get(user, id);
  }

  async remove(user: any, id: string) {
    const vid = BigInt(id);
    const target = await this.prisma.vehicle.findUnique({ where: { id: vid } });
    if (!target) throw new NotFoundException("Vehicle not found");

    const role = (user?.role ?? "").toString();
    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      const tenantIdReq = user?.tenantId ?? null;
      const tenantIdTarget = target.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    await this.prisma.customervehicle.deleteMany({ where: { vehicleId: vid } });
    await this.prisma.workorder.deleteMany({ where: { vehicleId: vid } });
    await this.prisma.vehicle.delete({ where: { id: vid } });
    return { ok: true };
  }

  async updateImageUrl(id: string, imageUrl: string) {
    return this.prisma.vehicle.update({
      where: { id: BigInt(id) },
      data: { imageUrl },
    });
  }
}
