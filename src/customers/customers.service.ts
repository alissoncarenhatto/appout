import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: string | number | bigint | null): bigint | null {
    if (id === null || id === undefined) return null;
    if (typeof id === "bigint") return id;
    return BigInt(String(id));
  }

  async findAll(user: any, q?: string) {
    const where: any = {};

    if (q && q.trim() !== "") {
      const s = q.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { document: { contains: s, mode: "insensitive" } },
      ];
    }

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantId = user?.tenantId ?? null;
      where.tenantId = tenantId ? this.toBigInt(tenantId) : null;
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: 200,
    });
  }

  async findOne(user: any, id: bigint) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException("Customer not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantId = user?.tenantId ?? null;
      const t = tenantId ? this.toBigInt(tenantId) : null;
      if (String(customer.tenantId ?? null) !== String(t)) {
        throw new ForbiddenException("Not allowed");
      }
    }
    return customer;
  }

  async create(user: any, data: any) {
    const role = (user?.role ?? "").toString();

    let tenantIdToSave: bigint | null = null;
    if (role === "SYSTEM_ADMIN") {
      tenantIdToSave = data.tenantId ? this.toBigInt(data.tenantId) : null;
    } else {
      tenantIdToSave = user?.tenantId ? this.toBigInt(user.tenantId) : null;
    }

    const created = await this.prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        document: data.document ?? null,
        notes: data.notes ?? null,
        tenantId: tenantIdToSave,
      },
    });

    return created;
  }

  async update(user: any, id: bigint, data: any) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Customer not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantIdUser = user?.tenantId ? this.toBigInt(user.tenantId) : null;
      if (String(existing.tenantId ?? null) !== String(tenantIdUser)) {
        throw new ForbiddenException("Not allowed");
      }

      data.tenantId = existing.tenantId;
    } else {
      data.tenantId =
        data.tenantId !== undefined
          ? data.tenantId
            ? this.toBigInt(data.tenantId)
            : null
          : existing.tenantId;
    }

    const updateData: any = {
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      document: data.document ?? existing.document,
      notes: data.notes ?? existing.notes,
      tenantId: data.tenantId ?? existing.tenantId,
    };

    const updated = await this.prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async remove(user: any, id: bigint) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Customer not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantIdUser = user?.tenantId ? this.toBigInt(user.tenantId) : null;
      if (String(existing.tenantId ?? null) !== String(tenantIdUser)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  async vehiclesOfCustomer(user: any, customerId: string | number | bigint) {
    const cid = this.toBigInt(customerId)!;
    const cust = await this.prisma.customer.findUnique({ where: { id: cid } });
    if (!cust) throw new NotFoundException("Customer not found");

    const role = (user?.role ?? "").toString();
    if (role !== "SYSTEM_ADMIN") {
      const tenantIdUser = user?.tenantId ? this.toBigInt(user.tenantId) : null;
      if (String(cust.tenantId ?? null) !== String(tenantIdUser)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const links = await this.prisma.customervehicle.findMany({
      where: { customerId: cid },
      include: { vehicle: { include: { brand: true, model: true } } },
      orderBy: { vehicleId: "desc" },
    });

    return links.map((l) => l.vehicle);
  }
}
