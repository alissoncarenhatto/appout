import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  private toBigIntOrNull(v?: string | null) {
    if (v == null) return null;
    const s = String(v);
    if (!s) return null;
    return BigInt(s);
  }

  private async setOwnersInternal(vehicleId: bigint, customers?: string[]) {
    await this.prisma.customervehicle.deleteMany({ where: { vehicleId } });
    const ids = (customers ?? []).map(x => BigInt(String(x)));
    if (!ids.length) return;
    await this.prisma.customervehicle.createMany({
      data: ids.map(customerId => ({ vehicleId, customerId })),
      skipDuplicates: true,
    });
  }

  async list() {
    return this.prisma.vehicle.findMany({
      include: {
        brand: true,
        model: true,
        customervehicle: { include: { customer: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async get(id: string) {
    const vid = BigInt(id);
    const found = await this.prisma.vehicle.findUnique({
      where: { id: vid },
      include: {
        brand: true,
        model: true,
        customervehicle: { include: { customer: true } },
      },
    });
    if (!found) throw new NotFoundException('Vehicle not found');
    return found;
  }

  async create(dto: CreateVehicleDto) {
    const created = await this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        brandId: this.toBigIntOrNull(dto.brandId),
        modelId: this.toBigIntOrNull(dto.modelId),
        year: dto.year ?? null,
        imageUrl: dto.imageUrl ?? null,
      },
    });

    if (dto.customers?.length) {
      await this.setOwnersInternal(created.id, dto.customers);
    }

    return this.get(String(created.id));
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vid = BigInt(id);

    await this.prisma.vehicle.update({
      where: { id: vid },
      data: {
        plate: dto.plate,
        brandId: dto.brandId !== undefined ? this.toBigIntOrNull(dto.brandId) : undefined,
        modelId: dto.modelId !== undefined ? this.toBigIntOrNull(dto.modelId) : undefined,
        year: dto.year !== undefined ? dto.year : undefined,
        
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : undefined,
      },
    });

    if (dto.customers) {
      await this.setOwnersInternal(vid, dto.customers);
    }

    return this.get(id);
  }

  async remove(id: string) {
    const vid = BigInt(id);
    await this.prisma.customervehicle.deleteMany({ where: { vehicleId: vid } });
    await this.prisma.workorder.deleteMany({ where: { vehicleId: vid } });
    await this.prisma.vehicle.delete({ where: { id: vid } });
    return { ok: true };
  }

  async updateImageUrl(id: string, imageUrl: string) {
    return this.prisma.vehicle.update({
      where: { id: BigInt(id) },
      data: { imageUrl },
    });
  }
}
