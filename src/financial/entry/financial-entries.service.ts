import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FinancialEntriesService {
  constructor(private prisma: PrismaService) {}

  private toBigInt(id?: any) {
    if (!id) return null;
    return BigInt(String(id));
  }

  async findAll(user: any) {
    const where: any = {};

    if (user?.role !== "SYSTEM_ADMIN") {
      where.tenantId = this.toBigInt(user?.tenantId);
    }

    return this.prisma.financialEntry.findMany({
      where,
      orderBy: { dueDate: "desc" },
    });
  }

  async create(user: any, data: any) {
    const tenantId =
      user?.role === "SYSTEM_ADMIN"
        ? this.toBigInt(data.tenantId)
        : this.toBigInt(user?.tenantId);

    return this.prisma.financialEntry.create({
      data: {
        type: data.type,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        description: data.description ?? null,
        paymentMethodId: data.paymentMethodId
          ? this.toBigInt(data.paymentMethodId)
          : null,
        tenantId,
      },
    });
  }

  async markAsPaid(user: any, id: bigint) {
    const entry = await this.prisma.financialEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException("Entry not found");

    return this.prisma.financialEntry.update({
      where: { id },
      data: { paidAt: new Date() },
    });
  }
}
