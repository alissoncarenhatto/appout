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

  private tenantIdOf(user: any) {
    return user?.tenantId ?? null;
  }

  private async ensureCatalogCompatibility(
    tenantId: string | number | bigint | null,
    brandId?: string | null,
    modelId?: string | null,
  ) {
    const tenant = tenantId != null ? BigInt(String(tenantId)) : null;
    let resolvedBrandId = brandId ? BigInt(String(brandId)) : null;
    let resolvedModelId = modelId ? BigInt(String(modelId)) : null;

    let brand: any = null;
    let model: any = null;

    if (resolvedModelId) {
      model = await this.prisma.model.findUnique({
        where: { id: resolvedModelId },
        include: { brand: true },
      });
      if (!model) throw new NotFoundException("Model not found");

      if (resolvedBrandId && String(model.brandId) !== String(resolvedBrandId)) {
        throw new ForbiddenException("Model does not belong to the selected brand");
      }

      resolvedBrandId = model.brandId;
    }

    if (resolvedBrandId) {
      brand = await this.prisma.brand.findUnique({
        where: { id: resolvedBrandId },
      });
      if (!brand) throw new NotFoundException("Brand not found");
    }

    if (brand?.tenantId !== null && brand?.tenantId !== undefined) {
      if (tenant !== null && String(brand.tenantId) !== String(tenant)) {
        throw new ForbiddenException("Brand does not belong to the selected tenant");
      }
    }

    if (model?.tenantId !== null && model?.tenantId !== undefined) {
      if (tenant !== null && String(model.tenantId) !== String(tenant)) {
        throw new ForbiddenException("Model does not belong to the selected tenant");
      }
    }

    return {
      brandId: resolvedBrandId,
      modelId: resolvedModelId,
    };
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
      tenantId = this.tenantIdOf(user);
    }

    const catalog = await this.ensureCatalogCompatibility(
      tenantId,
      dto.brandId ?? null,
      dto.modelId ?? null,
    );

    const created = await this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        brandId: catalog.brandId,
        modelId: catalog.modelId,
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
    let nextTenantId = target.tenantId;

    if (role === "TENANT_ADMIN" || role === "TENANT_USER") {
      const tenantIdReq = user?.tenantId ?? null;
      const tenantIdTarget = target.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }

      dto.tenantId = tenantIdTarget;
      nextTenantId = tenantIdTarget;
    } else if (dto.tenantId !== undefined) {
      nextTenantId = dto.tenantId ? BigInt(String(dto.tenantId)) : null;
    }

    const nextBrandId = dto.brandId !== undefined ? dto.brandId : undefined;
    const nextModelId = dto.modelId !== undefined ? dto.modelId : undefined;
    const catalog = await this.ensureCatalogCompatibility(
      nextTenantId,
      nextBrandId ?? null,
      nextModelId ?? null,
    );

    await this.prisma.vehicle.update({
      where: { id: vid },
      data: {
        plate: dto.plate !== undefined ? dto.plate : undefined,
        brandId:
          dto.brandId !== undefined || dto.modelId !== undefined
            ? catalog.brandId
            : undefined,
        modelId:
          dto.brandId !== undefined || dto.modelId !== undefined
            ? catalog.modelId
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
