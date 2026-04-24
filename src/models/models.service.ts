import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ModelsService {
  constructor(private prisma: PrismaService) {}

  private toBigIntOrNull(v?: string | number | bigint | null) {
    if (v === null || v === undefined) return null;
    if (typeof v === "bigint") return v;
    const s = String(v);
    if (!s) return null;
    return BigInt(s);
  }

  private canManageAll(user: any) {
    return (user?.role ?? "").toString() === "SYSTEM_ADMIN";
  }

  private tenantIdOf(user: any) {
    return user?.tenantId ? this.toBigIntOrNull(user.tenantId) : null;
  }

  async findAll(
    user: any,
    brandId?: string,
    search?: string,
    tenantId?: string,
  ) {
    const where: any = {};
    const role = (user?.role ?? "").toString();

    if (role === "SYSTEM_ADMIN") {
      if (brandId) {
        where.brandId = this.toBigIntOrNull(brandId);
      }
      if (tenantId !== undefined) {
        where.tenantId = tenantId ? this.toBigIntOrNull(tenantId) : null;
      }
    } else {
      where.tenantId = this.tenantIdOf(user);
      if (brandId) {
        where.brandId = this.toBigIntOrNull(brandId);
      }
    }

    if (search && search.trim() !== "") {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    return this.prisma.model.findMany({
      where,
      include: {
        brand: true,
        tenant: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });
  }

  async findOne(user: any, id: string) {
    const mid = BigInt(id);
    const found = await this.prisma.model.findUnique({
      where: { id: mid },
      include: {
        brand: true,
        tenant: true,
      },
    });

    if (!found) throw new NotFoundException("Model not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(found.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    return found;
  }

  async create(
    user: any,
    data: { name: string; brandId: string; tenantId?: string | number | null },
  ) {
    const role = (user?.role ?? "").toString();
    const tenantId =
      role === "SYSTEM_ADMIN"
        ? data.tenantId !== undefined
          ? this.toBigIntOrNull(data.tenantId)
          : null
        : this.tenantIdOf(user);

    const brandId = this.toBigIntOrNull(data.brandId);
    if (!brandId) throw new NotFoundException("Brand not found");

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException("Brand not found");

    if (
      brand.tenantId !== null &&
      String(brand.tenantId) !== String(tenantId ?? null)
    ) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.model.create({
      data: {
        name: data.name,
        brandId,
        tenantId,
      },
    });
  }

  async update(
    user: any,
    id: string,
    data: { name?: string; brandId?: string; tenantId?: string | number | null },
  ) {
    const mid = BigInt(id);
    const existing = await this.prisma.model.findUnique({ where: { id: mid } });
    if (!existing) throw new NotFoundException("Model not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(existing.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const nextTenantId =
      (user?.role ?? "").toString() === "SYSTEM_ADMIN"
        ? data.tenantId !== undefined
          ? this.toBigIntOrNull(data.tenantId)
          : existing.tenantId
        : existing.tenantId;

    let nextBrandId = existing.brandId;
    if (data.brandId !== undefined) {
      const brandIdToUse = this.toBigIntOrNull(data.brandId);
      if (!brandIdToUse) throw new NotFoundException("Brand not found");
      nextBrandId = brandIdToUse;
      const brand = await this.prisma.brand.findUnique({
        where: { id: nextBrandId },
      });
      if (!brand) throw new NotFoundException("Brand not found");
      if (
        brand.tenantId !== null &&
        String(brand.tenantId) !== String(nextTenantId ?? null)
      ) {
        throw new ForbiddenException("Not allowed");
      }
    }

    return this.prisma.model.update({
      where: { id: mid },
      data: {
        name: data.name ?? existing.name,
        brandId: nextBrandId,
        tenantId: nextTenantId,
      },
    });
  }

  async remove(user: any, id: string) {
    const mid = BigInt(id);
    const existing = await this.prisma.model.findUnique({ where: { id: mid } });
    if (!existing) throw new NotFoundException("Model not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(existing.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const vehicleCount = await this.prisma.vehicle.count({
      where: { modelId: mid },
    });

    if (vehicleCount > 0) {
      throw new ConflictException("Model is in use");
    }

    await this.prisma.model.delete({ where: { id: mid } });
    return { ok: true };
  }
}
