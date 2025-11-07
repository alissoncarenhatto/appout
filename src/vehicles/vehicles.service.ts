import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { plate: 'asc' },
      include: {
        brand: true,
        model: true,
        customervehicle: {
          include: {
            customer: true,
          },
        },
      },
    })
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: BigInt(id) },
      include: {
        brand: true,
        model: true,
        customervehicle: {
          include: {
            customer: true,
          },
        },
      },
    })
    if (!vehicle) throw new NotFoundException('Veículo não encontrado')
    return vehicle
  }

  async create(dto: any) {
    const created = await this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        year: dto.year ?? null,
        vin: dto.vin ?? null,
        color: dto.color ?? null,
        notes: dto.notes ?? null,
        brandId: dto.brandId ? BigInt(dto.brandId) : null,
        modelId: dto.modelId ? BigInt(dto.modelId) : null,
      },
    })

    if (dto.customerIds?.length) {
      await this.saveOwners(created.id, dto.customerIds)
    }

    return created
  }

  async update(id: string, dto: any) {
    const updated = await this.prisma.vehicle.update({
      where: { id: BigInt(id) },
      data: {
        plate: dto.plate,
        year: typeof dto.year !== 'undefined' ? dto.year : undefined,
        vin: typeof dto.vin !== 'undefined' ? dto.vin : undefined,
        color: typeof dto.color !== 'undefined' ? dto.color : undefined,
        notes: typeof dto.notes !== 'undefined' ? dto.notes : undefined,
        brandId:
          typeof dto.brandId !== 'undefined'
            ? dto.brandId
              ? BigInt(dto.brandId)
              : null
            : undefined,
        modelId:
          typeof dto.modelId !== 'undefined'
            ? dto.modelId
              ? BigInt(dto.modelId)
              : null
            : undefined,
      },
      include: {
        brand: true,
        model: true,
        customervehicle: {
          include: { customer: true },
        },
      },
    })

    if (dto.customerIds) {
      await this.saveOwners(updated.id, dto.customerIds)
    }

    return updated
  }

  async remove(id: string) {
    await this.prisma.vehicle.delete({ where: { id: BigInt(id) } })
    return { ok: true }
  }

  async updateCustomers(id: string, customerIds: (string | number)[]) {
    await this.saveOwners(BigInt(id), customerIds)
    return { ok: true }
  }

  private async saveOwners(vehicleId: bigint, customerIds: (string | number)[]) {
    await this.prisma.customervehicle.deleteMany({
      where: { vehicleId },
    })

    if (!customerIds?.length) return

    await this.prisma.customervehicle.createMany({
      data: customerIds.map((cid) => ({
        vehicleId,
        customerId: BigInt(cid),
      })),
    })
  }
}
