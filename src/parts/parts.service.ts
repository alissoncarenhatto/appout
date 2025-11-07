import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.part.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
  }

  create(data: any) {
    return this.prisma.part.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        sku: data.sku ?? null,
        price: data.price ?? 0,
        cost: data.cost ?? 0,
        stockQty: data.stockQty ?? 0,
        active: data.active ?? true,
      },
    })
  }

  update(id: string, data: any) {
    return this.prisma.part.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        description: data.description ?? null,
        sku: data.sku ?? null,
        price: data.price ?? 0,
        cost: data.cost ?? 0,
        stockQty: data.stockQty ?? 0,
        active: typeof data.active === 'boolean' ? data.active : undefined,
      },
    })
  }

  adjustStock(id: string, delta: number) {
    return this.prisma.part.update({
      where: { id: BigInt(id) },
      data: {
        stockQty: {
          increment: delta,
        },
      },
    })
  }
}
