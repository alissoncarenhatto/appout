import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface ListOpts {
  q?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list(user: any, opts: ListOpts = { page: 1, pageSize: 50 }) {
    const where: any = {};

    if (opts.q) {
      where.OR = [
        { name: { contains: opts.q, mode: "insensitive" } },
        { email: { contains: opts.q, mode: "insensitive" } },
      ];
    }

    const userRole = (user?.role ?? "").toString();

    if (userRole === "TENANT_ADMIN") {
      const tenantIdRaw = user?.tenantId ?? null;
      if (!tenantIdRaw) {
        throw new ForbiddenException("Tenant admin without tenantId");
      }

      where.tenantId = BigInt(String(tenantIdRaw));
    }

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 50;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true, tenant: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async get(id: string | number) {
    const u = await this.prisma.user.findUnique({
      where: { id: BigInt(String(id)) },
      include: { role: true, tenant: true },
    });
    if (!u) throw new NotFoundException("User not found");
    return u;
  }

  async create(reqUser: any, dto: any) {
    const creatorRole = (reqUser?.role ?? "").toString();
    const creatorTenantId = reqUser?.tenantId ? String(reqUser.tenantId) : null;

    let tenantIdToUse: string | null = null;

    if (creatorRole === "TENANT_ADMIN") {
      tenantIdToUse = creatorTenantId;
    } else {
      tenantIdToUse = dto.tenantId === "" ? null : (dto.tenantId ?? null);
      if (tenantIdToUse !== null) tenantIdToUse = String(tenantIdToUse);
    }

    let localeToUse = "pt-BR";

    if (tenantIdToUse) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: BigInt(tenantIdToUse) },
        select: { defaultLocale: true },
      });

      if (tenant?.defaultLocale) {
        localeToUse = tenant.defaultLocale;
      }
    }

    let roleIdToUse: number | undefined = undefined;

    if (dto.roleId !== undefined && dto.roleId !== null) {
      roleIdToUse = Number(dto.roleId);
    } else if (dto.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: String(dto.role) },
      });
      if (role) roleIdToUse = role.id;
    }

    if (creatorRole === "TENANT_ADMIN") {
      if (roleIdToUse) {
        const roleCheck = await this.prisma.role.findUnique({
          where: { id: roleIdToUse },
        });
        if (roleCheck?.name === "SYSTEM_ADMIN") {
          throw new ForbiddenException(
            "TENANT_ADMIN cannot create SYSTEM_ADMIN users",
          );
        }
      }

      tenantIdToUse = creatorTenantId;
    }

    const passwordHash = dto.password
      ? await this.hashPassword(dto.password)
      : "";

    const payload: any = {
      name: dto.name,
      email: dto.email,
      passwordHash,
      locale: localeToUse,
      ...(roleIdToUse !== undefined ? { roleId: roleIdToUse } : {}),
      tenantId: tenantIdToUse ? BigInt(tenantIdToUse) : null,
    };

    const created = await this.prisma.user.create({
      data: payload,
      include: { role: true, tenant: true },
    });

    return created;
  }

  async update(user: any, id: string | number, dto: any) {
    const target = await this.prisma.user.findUnique({
      where: { id: BigInt(String(id)) },
    });
    if (!target) throw new NotFoundException("User not found");

    if ((user?.role ?? "").toString() === "TENANT_ADMIN") {
      const tenantIdReq = user.tenantId ?? null;
      const tenantIdTarget = target.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }

      if (dto.roleId) {
        const role = await this.prisma.role.findUnique({
          where: { id: Number(dto.roleId) },
        });
        if (role?.name === "SYSTEM_ADMIN")
          throw new ForbiddenException("Cannot set SYSTEM_ADMIN");
      }

      dto.tenantId = tenantIdTarget;
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email;
    if (dto.password)
      updateData.passwordHash = await this.hashPassword(dto.password);
    if (dto.roleId !== undefined) updateData.roleId = dto.roleId;
    if (dto.tenantId !== undefined)
      updateData.tenantId = dto.tenantId ? BigInt(String(dto.tenantId)) : null;

    if (dto.locale !== undefined) {
      updateData.locale = dto.locale;
    }

    const updated = await this.prisma.user.update({
      where: { id: BigInt(String(id)) },
      data: updateData,
      include: { role: true, tenant: true },
    });

    return updated;
  }

  async remove(user: any, id: string | number) {
    const target = await this.prisma.user.findUnique({
      where: { id: BigInt(String(id)) },
    });
    if (!target) throw new NotFoundException("User not found");

    if ((user?.role ?? "").toString() === "TENANT_ADMIN") {
      const tenantIdReq = user.tenantId ?? null;
      const tenantIdTarget = target.tenantId ?? null;
      if (String(tenantIdReq) !== String(tenantIdTarget)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    await this.prisma.user.delete({ where: { id: BigInt(String(id)) } });
    return { ok: true };
  }

  private async hashPassword(pw: string) {
    const bcrypt = await import("bcrypt");
    return bcrypt.hash(pw, 10);
  }
}
