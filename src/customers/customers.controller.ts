import { Controller, Get, Query, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() body: any) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.customersService.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(BigInt(id));
  }

  @Get(':id/vehicles')
  vehicles(@Param('id') id: string) {
    return this.customersService.vehiclesOfCustomer(id);
  }
}
