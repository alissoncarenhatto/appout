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

  // lista geral
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // usado pela agenda: /workorders/range?from=...&to=...
  @Get('range')
  findByRange(@Query('from') from: string, @Query('to') to: string) {
    return this.service.findByRange(from, to);
  }

  // criar OS
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  // adicionar serviço na OS
  @Post(':id(\\d+)/services')
  addService(@Param('id') id: string, @Body() body: any) {
    return this.service.addService(id, body);
  }

  // adicionar peça na OS
  @Post(':id(\\d+)/parts')
  addPart(@Param('id') id: string, @Body() body: any) {
    return this.service.addPart(id, body);
  }

  // totais
  @Get(':id(\\d+)/totals')
  totals(@Param('id') id: string) {
    return this.service.totals(id);
  }

  // iniciar
  @Patch(':id(\\d+)/start')
  start(@Param('id') id: string) {
    return this.service.start(id);
  }

  // finalizar
  @Patch(':id(\\d+)/finish')
  finish(@Param('id') id: string) {
    return this.service.finish(id);
  }

  // agenda: PATCH /workorders/:id/schedule
  @Patch(':id(\\d+)/schedule')
  schedule(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string | null },
  ) {
    return this.service.schedule(id, body);
  }

  // 👇 TEM QUE FICAR POR ÚLTIMO e COM REGEX SÓ PRA NÚMERO
  // assim /workorders/schedule NÃO cai aqui
  @Get(':id(\\d+)')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
