import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { ServicesCatalogService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services-catalog')
export class ServicesCatalogController {
  constructor(private readonly services: ServicesCatalogService) {}

  @Get()
  list() {
    return this.services.list();
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.services.remove(id);
  }
}
