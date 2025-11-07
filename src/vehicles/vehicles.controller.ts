import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { VehiclesService } from './vehicles.service'

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll() {
    return this.vehiclesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id)
  }

  @Post()
  create(@Body() dto: any) {
    return this.vehiclesService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.vehiclesService.update(id, dto)
  }

  @Patch(':id/customers')
  updateCustomers(
    @Param('id') id: string,
    @Body() body: { customerIds: (string | number)[] },
  ) {
    return this.vehiclesService.updateCustomers(id, body.customerIds ?? [])
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id)
  }
}
