import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workorders/:id/payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post()
  add(@Param('id', ParseIntPipe) id: number, @Body() body: { method: 'CASH'|'CARD'|'PIX'|'TRANSFER'|'OTHER'; amount: number }) {
    return this.service.add(id, body)
  }
}
