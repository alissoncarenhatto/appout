import { Module } from '@nestjs/common'
import { PdfController } from './pdf.controller'
import { WorkordersModule } from '../workorders/workorders.module'

@Module({ imports: [WorkordersModule], controllers: [PdfController] })
export class PdfModule {}
