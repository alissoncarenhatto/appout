import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}
  add(workOrderId: number, data: { method: 'CASH'|'CARD'|'PIX'|'TRANSFER'|'OTHER'; amount: number }) {
    return this.prisma.payment.create({ data: { workOrderId, method: data.method, amount: data.amount } })
  }
}
