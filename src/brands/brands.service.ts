import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandsService {
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

  async findAll(user: any, search?: string, tenantId?: string) {
    const where: any = {};
    const role = (user?.role ?? "").toString();

    if (role === "SYSTEM_ADMIN") {
      if (tenantId !== undefined) {
        where.tenantId = tenantId ? this.toBigIntOrNull(tenantId) : null;
      }
    } else {
      where.tenantId = this.tenantIdOf(user);
    }

    if (search && search.trim() !== "") {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    return this.prisma.brand.findMany({
      where,
      include: {
        tenant: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });
  }

  async findOne(user: any, id: string) {
    const bid = BigInt(id);
    const found = await this.prisma.brand.findUnique({
      where: { id: bid },
      include: { tenant: true },
    });

    if (!found) throw new NotFoundException("Brand not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(found.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    return found;
  }

  async create(user: any, data: { name: string; tenantId?: string | number | null }) {
    const role = (user?.role ?? "").toString();
    const tenantId =
      role === "SYSTEM_ADMIN"
        ? data.tenantId !== undefined
          ? this.toBigIntOrNull(data.tenantId)
          : null
        : this.tenantIdOf(user);

    return this.prisma.brand.create({
      data: {
        name: data.name,
        tenantId,
      },
    });
  }

  async update(
    user: any,
    id: string,
    data: { name?: string; tenantId?: string | number | null },
  ) {
    const bid = BigInt(id);
    const existing = await this.prisma.brand.findUnique({ where: { id: bid } });
    if (!existing) throw new NotFoundException("Brand not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(existing.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const tenantId =
      (user?.role ?? "").toString() === "SYSTEM_ADMIN"
        ? data.tenantId !== undefined
          ? this.toBigIntOrNull(data.tenantId)
          : existing.tenantId
        : existing.tenantId;

    return this.prisma.brand.update({
      where: { id: bid },
      data: {
        name: data.name ?? existing.name,
        tenantId,
      },
    });
  }

  async remove(user: any, id: string) {
    const bid = BigInt(id);
    const existing = await this.prisma.brand.findUnique({ where: { id: bid } });
    if (!existing) throw new NotFoundException("Brand not found");

    if (!this.canManageAll(user)) {
      const userTenantId = this.tenantIdOf(user);
      if (String(existing.tenantId ?? null) !== String(userTenantId)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const [modelCount, vehicleCount] = await Promise.all([
      this.prisma.model.count({ where: { brandId: bid } }),
      this.prisma.vehicle.count({ where: { brandId: bid } }),
    ]);

    if (modelCount > 0 || vehicleCount > 0) {
      throw new ConflictException("Brand is in use");
    }

    await this.prisma.brand.delete({ where: { id: bid } });
    return { ok: true };
  }
}
