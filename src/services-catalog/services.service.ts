import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ServicesCatalogService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.servicecatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
  }

  create(data: any) {
    return this.prisma.servicecatalog.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        defaultPrice: data.defaultPrice ?? 0,
        defaultDurationMin: data.defaultDurationMin ?? 60,
        cost: data.cost ?? 0,
        active: data.active ?? true,
      },
    })
  }

  findOne(id: string) {
    return this.prisma.servicecatalog.findUnique({
      where: { id: BigInt(id) },
    })
  }

  update(id: string, data: any) {
    return this.prisma.servicecatalog.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        description: data.description ?? null,
        defaultPrice: data.defaultPrice ?? 0,
        defaultDurationMin: data.defaultDurationMin ?? 60,
        cost: data.cost ?? 0,
        active: typeof data.active === 'boolean' ? data.active : undefined,
      },
    })
  }

  remove(id: string) {
    return this.prisma.servicecatalog.delete({
      where: { id: BigInt(id) },
    })
  }
}
