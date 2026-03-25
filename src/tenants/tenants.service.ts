import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(data: CreateTenantDto) {
    return this.prisma.tenant.create({ data: this.normalizeTenantData(data) });
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
      data: this.normalizeTenantData(data),
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tenant.delete({ where: { id: BigInt(id) } });
  }

  async updateLogoUrl(id: number, logoUrl: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id: BigInt(id) },
      data: { logoUrl },
    });
  }

  private normalizeTenantData<T extends Record<string, any>>(data: T): T {
    const country =
      data.country !== undefined && data.country !== null
        ? this.i18n.normalizeCountry(data.country)
        : data.country;

    return {
      ...data,
      code: this.emptyToNull(data.code),
      document: this.emptyToNull(data.document),
      phone: this.emptyToNull(data.phone),
      email: this.emptyToNull(data.email),
      address: this.emptyToNull(data.address),
      logoUrl: this.emptyToNull(data.logoUrl),
      country,
      defaultLocale:
        data.defaultLocale !== undefined
          ? this.i18n.normalizeLocale(data.defaultLocale, null, country)
          : this.emptyToNull(data.defaultLocale),
    } as T;
  }

  private emptyToNull(value: any) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    return typeof value === "string" ? value.trim() : value;
  }
}
