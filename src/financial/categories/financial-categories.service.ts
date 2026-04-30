import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFinancialCategoryDto } from "./dto/create-financial-category.dto";
import { UpdateFinancialCategoryDto } from "./dto/update-financial-category.dto";
import { ListFinancialCategoryDto } from "./dto/list-financial-category.dto";

@Injectable()
export class FinancialCategoriesService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: string | number | bigint | null) {
    if (id === null || id === undefined || id === "") return null;
    if (typeof id === "bigint") return id;
    return BigInt(String(id));
  }

  private checkTenant(user: any, tenantId: bigint | null) {
    if (String(user?.role ?? "") === "SYSTEM_ADMIN") return;

    const userTenant = user?.tenantId ? this.toBigInt(user.tenantId) : null;

    if (String(userTenant) !== String(tenantId ?? null)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  async findAll(user: any, query: ListFinancialCategoryDto) {
    const { q, page = 1, pageSize = 10 } = query;
    const where: any = {};

    if (q?.trim()) {
      where.name = {
        contains: q.trim(),
        mode: "insensitive",
      };
    }

    if (String(user?.role ?? "") !== "SYSTEM_ADMIN") {
      where.tenantId = user?.tenantId ? this.toBigInt(user.tenantId) : null;
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.financialCategory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.financialCategory.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(user: any, id: bigint) {
    const category = await this.prisma.financialCategory.findUnique({
      where: { id },
    });

    if (!category) throw new NotFoundException("Category not found");

    this.checkTenant(user, category.tenantId);

    return category;
  }

  async create(user: any, data: CreateFinancialCategoryDto) {
    const role = String(user?.role ?? "");
    const tenantId =
      role === "SYSTEM_ADMIN"
        ? this.toBigInt(data.tenantId)
        : user?.tenantId
          ? this.toBigInt(user.tenantId)
          : null;

    return this.prisma.financialCategory.create({
      data: {
        name: data.name,
        color: data.color ?? null,
        icon: data.icon ?? null,
        tenantId,
      },
    });
  }

  async update(user: any, id: bigint, data: UpdateFinancialCategoryDto) {
    const existing = await this.findOne(user, id);

    return this.prisma.financialCategory.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        color: data.color === undefined ? existing.color : data.color,
        icon: data.icon === undefined ? existing.icon : data.icon,
      },
    });
  }

  async remove(user: any, id: bigint) {
    await this.findOne(user, id);

    await this.prisma.financialCategory.delete({ where: { id } });

    return { ok: true };
  }
}
