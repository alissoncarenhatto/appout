import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    return this.prisma.tenant.create({ data });
  }

  async findAll() {
    return this.prisma.tenant.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: BigInt(id) } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: number, data: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tenant.delete({ where: { id: BigInt(id) } });
  }
}
