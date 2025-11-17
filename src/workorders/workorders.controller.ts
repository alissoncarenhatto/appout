import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkordersService } from './workorders.service';

@Controller('workorders')
export class WorkordersController {
  constructor(private readonly service: WorkordersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('range')
  findByRange(@Query('from') from: string, @Query('to') to: string) {
    return this.service.findByRange(from, to);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post(':id(\\d+)/services')
  addService(@Param('id') id: string, @Body() body: any) {
    return this.service.addService(id, body);
  }

  @Post(':id(\\d+)/parts')
  addPart(@Param('id') id: string, @Body() body: any) {
    return this.service.addPart(id, body);
  }

  @Get(':id(\\d+)/totals')
  totals(@Param('id') id: string) {
    return this.service.totals(id);
  }

  @Patch(':id(\\d+)/start')
  start(@Param('id') id: string) {
    return this.service.start(id);
  }

  @Patch(':id(\\d+)/finish')
  finish(@Param('id') id: string) {
    return this.service.finish(id);
  }

  @Patch(':id(\\d+)/schedule')
  schedule(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string | null },
  ) {
    return this.service.schedule(id, body);
  }

  @Get(':id(\\d+)')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
