import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModelsService {
  constructor(private prisma: PrismaService) {}

  findAll(brandId?: string, search?: string) {
    const where: any = {};

    if (brandId) {
      where.brandId = BigInt(brandId);
    }

    if (search && search.trim() !== '') {
      where.name = { contains: search.trim() };
    }

    return this.prisma.model.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  create(data: { name: string; brandId: string }) {
    return this.prisma.model.create({
      data: {
        name: data.name,
        brandId: BigInt(data.brandId),
      },
    });
  }
}
