import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    if (search && search.trim() !== '') {
      const s = search.trim();
      return this.prisma.brand.findMany({
        where: {
          name: {
            contains: s,
          },
        },
        orderBy: { name: 'asc' },
        take: 50,
      });
    }

    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
