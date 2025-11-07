import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { PartsService } from './parts.service'

@Controller('parts')
export class PartsController {
  constructor(private service: PartsService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Patch(':id/stock')
  adjustStock(@Param('id') id: string, @Body() body: { delta: number }) {
    return this.service.adjustStock(id, body.delta ?? 0)
  }
}
