import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  @Roles('SYSTEM_ADMIN')
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('SYSTEM_ADMIN')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
