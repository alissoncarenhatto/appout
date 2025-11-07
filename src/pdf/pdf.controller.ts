import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import PdfPrinter from 'pdfmake'

@Controller('pdf')
export class PdfController {
  @Get('os')
  async gerarPdf(@Res() res: Response) {
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf',
      },
    }

    const printer = new PdfPrinter(fonts)

    const docDefinition: any = {
      content: [
        { text: 'Ordem de Serviço', style: 'header' },
        { text: 'Cliente: Fulano de Tal' },
        { text: 'Veículo: ABC1D23' },
        { text: 'Serviços / Peças:', margin: [0, 16, 0, 8] },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Descrição', 'Qtd', 'Total'],
              ['Troca de óleo', '1', '150,00'],
              ['Filtro de óleo', '1', '35,00'],
            ],
          },
        },
        { text: 'Total: R$ 185,00', style: 'total', margin: [0, 16, 0, 0] },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 12] },
        total: { fontSize: 14, bold: true },
      },
      defaultStyle: {
        font: 'Roboto',
      },
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="os.pdf"')

    pdfDoc.pipe(res)
    pdfDoc.end()
  }
}
