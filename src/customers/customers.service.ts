import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    if (search && search.trim() !== '') {
      const s = search.trim();

      return this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: s } },
            { email: { contains: s } },
            { phone: { contains: s } },
            { document: { contains: s } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 50,
      });
    }

    return this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  findOne(id: bigint) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  create(data: any) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        document: data.document,
        notes: data.notes,
      },
    });
  }

  update(id: bigint, data: any) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        document: data.document,
        notes: data.notes,
      },
    });
  }

  remove(id: bigint) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
