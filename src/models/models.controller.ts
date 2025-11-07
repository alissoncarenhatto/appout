import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
  constructor(private readonly service: ModelsService) {}

  @Get()
  findAll(
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(brandId, search);
  }

  @Post()
  create(@Body() body: { name: string; brandId: string }) {
    return this.service.create(body);
  }
}
