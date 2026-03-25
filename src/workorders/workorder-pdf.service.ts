import { Injectable } from "@nestjs/common";
import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

type WorkorderLineItem = {
  description: string;
  details?: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
};

@Injectable()
export class WorkorderPdfService {
  private readonly pageWidth = 595.28;
  private readonly pageHeight = 841.89;
  private readonly margin = 42;
  private readonly contentWidth = this.pageWidth - this.margin * 2;
  private readonly dark = "#111111";
  private readonly text = "#202124";
  private readonly muted = "#6B7280";
  private readonly soft = "#F3F4F6";
  private readonly line = "#D1D5DB";
  private readonly footerHeight = 50;
  private readonly footerTop = this.pageHeight - this.margin - this.footerHeight - 18;
  private readonly contentBottom = this.footerTop - 16;
  private readonly pageNumberY = this.pageHeight - this.margin - 12;

  async generate(workorder: any): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads", "workorders");
    fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `workorder-${workorder.id}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    const doc = new PDFDocument({
      margin: this.margin,
      size: "A4",
      bufferPages: true,
    });
    doc.pipe(fs.createWriteStream(filepath));

    const services = (workorder.workorderservice ?? []).map((item: any) => ({
      description: item.servicecatalog?.name ?? "Servico",
      details: item.servicecatalog?.description ?? null,
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      discount: Number(item.discount ?? 0),
    }));

    const parts = (workorder.workorderpart ?? []).map((item: any) => ({
      description: item.part?.name ?? "Peca",
      details: item.part?.description ?? null,
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      discount: Number(item.discount ?? 0),
    }));

    const servicesSubtotal = this.sumItems(services);
    const partsSubtotal = this.sumItems(parts);
    const orderDiscount = Number(workorder.discount ?? 0);
    const total = servicesSubtotal + partsSubtotal - orderDiscount;

    this.drawBrandHeader(doc, workorder);
    this.drawDocumentBand(doc, workorder);
    this.drawPartyRow(doc, workorder);
    this.drawBasicInfo(doc, workorder);
    this.drawTableSection(doc, "Servicos", services);
    this.drawTableSection(doc, "Pecas", parts);
    this.drawSummaryBox(doc, servicesSubtotal, partsSubtotal, orderDiscount, total);
    this.drawNotes(doc, workorder.notes);
    this.drawWorkshopFooter(doc, workorder);
    this.addPageNumbers(doc);

    doc.end();

    return `/uploads/workorders/${filename}`;
  }

  private drawBrandHeader(doc: PDFKit.PDFDocument, workorder: any) {
    const tenantName = this.valueOrDash(workorder.tenant?.name).toUpperCase();
    const initials = this.getInitials(workorder.tenant?.name);
    const centerX = this.pageWidth / 2;
    const badgeY = 24;
    const logoPath = this.resolveLocalAssetPath(workorder.tenant?.logoUrl);

    if (logoPath) {
      doc
        .roundedRect(centerX - 34, badgeY - 2, 68, 68, 16)
        .fillAndStroke("#FFFFFF", this.line);
      doc.image(logoPath, centerX - 28, badgeY + 4, {
        fit: [56, 56],
        align: "center",
        valign: "center",
      });
    } else {
      doc
        .circle(centerX, badgeY + 28, 28)
        .fillAndStroke("#FFFFFF", this.dark);
      doc
        .circle(centerX, badgeY + 28, 24)
        .stroke(this.dark);

      doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(16);
      doc.text(initials, centerX - 24, badgeY + 20, {
        width: 48,
        align: "center",
      });
    }

    doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(14);
    doc.text(tenantName, this.margin, badgeY + 72, {
      width: this.contentWidth,
      align: "center",
    });

    doc.fillColor(this.muted).font("Helvetica").fontSize(9.5);
    doc.text("Comprovante de manutencao automotiva", this.margin, badgeY + 92, {
      width: this.contentWidth,
      align: "center",
    });

    doc.y = badgeY + 120;
  }

  private drawDocumentBand(doc: PDFKit.PDFDocument, workorder: any) {
    const top = doc.y;
    const label = `Nota de servico ${String(workorder.number ?? workorder.id)}`;

    doc.rect(this.margin, top, this.contentWidth, 22).fill(this.dark);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11);
    doc.text(label, this.margin + 10, top + 6);

    doc.y = top + 34;
  }

  private drawPartyRow(doc: PDFKit.PDFDocument, workorder: any) {
    const top = doc.y;
    const leftWidth = 280;
    const rightX = this.margin + 300;

    doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(9.5);
    doc.text("Cliente", this.margin, top);
    doc.font("Helvetica").fontSize(10.5);
    doc.text(this.valueOrDash(workorder.customer?.name), this.margin, top + 14, {
      width: leftWidth,
    });

    const leftSub = [
      this.valueOrDash(workorder.customer?.email),
      this.valueOrDash(workorder.customer?.phone),
    ]
      .filter((v) => v !== "-")
      .join("  |  ");

    if (leftSub) {
      doc.fillColor(this.muted).fontSize(8.8);
      doc.text(leftSub, this.margin, top + 29, { width: leftWidth });
    }

    doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(9.5);
    doc.text("Oficina", rightX, top);
    doc.font("Helvetica").fontSize(10.5);
    doc.text(this.valueOrDash(workorder.tenant?.name), rightX, top + 14, {
      width: 210,
      align: "right",
    });

    const rightSub = [
      workorder.tenant?.code ? `Cod. ${workorder.tenant.code}` : null,
      workorder.tenant?.document ? workorder.tenant.document : null,
      workorder.tenant?.country ? workorder.tenant.country : null,
    ]
      .filter(Boolean)
      .join("  |  ");

    if (rightSub) {
      doc.fillColor(this.muted).fontSize(8.8);
      doc.text(rightSub, rightX, top + 29, {
        width: 210,
        align: "right",
      });
    }

    doc.moveTo(this.margin, top + 52).lineTo(this.pageWidth - this.margin, top + 52).stroke(this.line);
    doc.y = top + 64;
  }

  private drawBasicInfo(doc: PDFKit.PDFDocument, workorder: any) {
    this.drawSectionHeader(doc, "Informacoes basicas");

    const leftX = this.margin;
    const rightX = this.margin + 250;
    const top = doc.y;

    const leftRows: Array<[string, string]> = [
      ["Marca", this.valueOrDash(workorder.vehicle?.brand?.name)],
      ["Placa do veiculo", this.valueOrDash(workorder.vehicle?.plate)],
      ["Chassi", this.valueOrDash(workorder.vehicle?.vin)],
      ["Cliente", this.valueOrDash(workorder.customer?.name)],
    ];

    const rightRows: Array<[string, string]> = [
      ["Modelo", this.valueOrDash(workorder.vehicle?.model?.name)],
      ["Cor", this.valueOrDash(workorder.vehicle?.color)],
      ["Ano", this.valueOrDash(workorder.vehicle?.year?.toString())],
      ["Status", this.formatStatus(workorder.status)],
    ];

    const leftHeight = this.drawDetailsColumn(doc, leftX, top, 210, leftRows);
    const rightHeight = this.drawDetailsColumn(doc, rightX, top, 210, rightRows);

    const metaTop = top + Math.max(leftHeight, rightHeight) + 4;
    doc.fillColor(this.muted).font("Helvetica").fontSize(8.8);
    doc.text(
      `Agendado: ${this.formatDateTime(workorder.scheduledAt)}  |  Iniciado: ${this.formatDateTime(workorder.startedAt)}  |  Finalizado: ${this.formatDateTime(workorder.finishedAt)}`,
      this.margin,
      metaTop,
      { width: this.contentWidth },
    );

    doc.y = metaTop + 22;
  }

  private drawTableSection(
    doc: PDFKit.PDFDocument,
    title: string,
    items: WorkorderLineItem[],
  ) {
    this.ensureSpace(doc, 60);
    this.drawSectionHeader(doc, title);

    const top = doc.y;
    const columns = {
      description: this.margin + 8,
      unit: this.margin + 294,
      unitPrice: this.margin + 342,
      qty: this.margin + 424,
      total: this.margin + 456,
    };
    const columnWidths = {
      description: 272,
      unit: 40,
      unitPrice: 74,
      qty: 26,
      total: 56,
    };

    doc.fillColor(this.muted).font("Helvetica").fontSize(8);
    doc.text("Descricao", columns.description, top);
    doc.text("Unidade", columns.unit, top, {
      width: columnWidths.unit,
      align: "right",
      lineBreak: false,
    });
    doc.text("Preco unitario", columns.unitPrice, top, {
      width: columnWidths.unitPrice,
      align: "right",
      lineBreak: false,
    });
    doc.text("Qtd.", columns.qty, top, {
      width: columnWidths.qty,
      align: "right",
      lineBreak: false,
    });
    doc.text("Preco", columns.total, top, {
      width: columnWidths.total,
      align: "right",
      lineBreak: false,
    });

    let y = top + 16;
    doc.moveTo(this.margin, y).lineTo(this.pageWidth - this.margin, y).stroke(this.line);
    y += 8;

    if (!items.length) {
      doc.fillColor(this.muted).font("Helvetica").fontSize(9);
      doc.text("Nenhum item informado.", this.margin + 8, y + 4);
      doc.y = y + 24;
      return;
    }

    items.forEach((item) => {
      const lineTotal = item.qty * item.unitPrice - item.discount;
      const description = item.description.trim();
      const details = item.details?.trim() || null;
      const descriptionHeight = doc.heightOfString(description, {
        width: columnWidths.description,
        align: "left",
      });
      const detailsHeight = details
        ? doc.heightOfString(details, {
            width: columnWidths.description,
            align: "left",
          })
        : 0;
      const rowHeight = Math.max(
        18,
        descriptionHeight + (details ? detailsHeight + 3 : 0),
      );

      if (y + rowHeight + 10 > this.contentBottom) {
        doc.addPage();
        doc.y = this.margin;
        this.drawSectionHeader(doc, title);

        const continuedTop = doc.y;
        doc.fillColor(this.muted).font("Helvetica").fontSize(8);
        doc.text("Descricao", columns.description, continuedTop);
        doc.text("Unidade", columns.unit, continuedTop, {
          width: columnWidths.unit,
          align: "right",
          lineBreak: false,
        });
        doc.text("Preco unitario", columns.unitPrice, continuedTop, {
          width: columnWidths.unitPrice,
          align: "right",
          lineBreak: false,
        });
        doc.text("Qtd.", columns.qty, continuedTop, {
          width: columnWidths.qty,
          align: "right",
          lineBreak: false,
        });
        doc.text("Preco", columns.total, continuedTop, {
          width: columnWidths.total,
          align: "right",
          lineBreak: false,
        });

        y = continuedTop + 16;
        doc
          .moveTo(this.margin, y)
          .lineTo(this.pageWidth - this.margin, y)
          .stroke(this.line);
        y += 8;
      }

      doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(9);
      doc.text(description, columns.description, y, {
        width: columnWidths.description,
      });

      if (details) {
        doc.fillColor(this.muted).font("Helvetica").fontSize(7.8);
        doc.text(details, columns.description, y + descriptionHeight + 3, {
          width: columnWidths.description,
        });
      }

      doc.fillColor(this.dark).font("Helvetica").fontSize(9);
      doc.text("un", columns.unit, y, {
        width: columnWidths.unit,
        align: "right",
        lineBreak: false,
      });
      doc.text(this.formatMoney(item.unitPrice), columns.unitPrice, y, {
        width: columnWidths.unitPrice,
        align: "right",
        lineBreak: false,
      });
      doc.text(this.formatQty(item.qty), columns.qty, y, {
        width: columnWidths.qty,
        align: "right",
        lineBreak: false,
      });
      doc.text(this.formatMoney(lineTotal), columns.total, y, {
        width: columnWidths.total,
        align: "right",
        lineBreak: false,
      });

      y += rowHeight;
    });

    doc.y = y + 8;
  }

  private drawSummaryBox(
    doc: PDFKit.PDFDocument,
    servicesSubtotal: number,
    partsSubtotal: number,
    orderDiscount: number,
    total: number,
  ) {
    this.ensureSpace(doc, 80);

    const boxWidth = 270;
    const x = this.pageWidth - this.margin - boxWidth;
    const y = doc.y + 4;

    doc.rect(x, y, boxWidth, 62).fill(this.soft);
    doc.moveTo(x, y).lineTo(x + boxWidth, y).stroke(this.line);
    doc.moveTo(x, y + 20).lineTo(x + boxWidth, y + 20).stroke(this.line);
    doc.moveTo(x, y + 40).lineTo(x + boxWidth, y + 40).stroke(this.line);
    doc.moveTo(x, y + 60).lineTo(x + boxWidth, y + 60).stroke(this.dark);

    const rows: Array<[string, string, number]> = [
      ["Servicos", this.formatMoney(servicesSubtotal), y + 5],
      ["Pecas", this.formatMoney(partsSubtotal), y + 25],
      ["Desconto", this.formatMoney(orderDiscount * -1), y + 45],
    ];

    rows.forEach(([label, value, rowY]) => {
      doc.fillColor(this.dark).font("Helvetica").fontSize(8.8);
      doc.text(label, x + 10, rowY as number);
      doc.text(value, x + 170, rowY as number, {
        width: 88,
        align: "right",
      });
    });

    doc.rect(x, y + 60, boxWidth, 20).fill(this.dark);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9.5);
    doc.text("Total", x + 10, y + 66);
    doc.text(this.formatMoney(total), x + 170, y + 66, {
      width: 88,
      align: "right",
    });

    doc.y = y + 78;
  }

  private drawNotes(doc: PDFKit.PDFDocument, notes?: string | null) {
    if (!notes?.trim()) return;

    const text = notes.trim();
    const notesHeight = doc.heightOfString(text, {
      width: this.contentWidth - 4,
      lineGap: 2,
    });

    this.ensureSpace(doc, notesHeight + 30);
    this.drawSectionHeader(doc, "Observacoes");

    doc.fillColor(this.dark).font("Helvetica").fontSize(9.5);
    doc.text(text, this.margin + 2, doc.y, {
      width: this.contentWidth - 4,
      lineGap: 2,
    });
  }

  private drawWorkshopFooter(doc: PDFKit.PDFDocument, workorder: any) {
    const top = this.footerTop;
    const textHeight = this.footerHeight - 6;

    doc.moveTo(this.margin, top).lineTo(this.pageWidth - this.margin, top).stroke(this.line);

    const tenantLines = [
      this.valueOrDash(workorder.tenant?.name),
      workorder.tenant?.code ? `Codigo: ${workorder.tenant.code}` : null,
      workorder.tenant?.document ? `Documento: ${workorder.tenant.document}` : null,
      workorder.tenant?.phone ? `Telefone: ${workorder.tenant.phone}` : null,
      workorder.tenant?.email ? `E-mail: ${workorder.tenant.email}` : null,
      workorder.tenant?.address ? workorder.tenant.address : null,
      workorder.tenant?.country ? `Pais: ${workorder.tenant.country}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const customerLines = [
      `Cliente: ${this.valueOrDash(workorder.customer?.name)}`,
      workorder.customer?.phone ? `Telefone: ${workorder.customer.phone}` : null,
      workorder.customer?.email ? `E-mail: ${workorder.customer.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    doc.fillColor(this.muted).font("Helvetica").fontSize(8.4);
    doc.text(tenantLines, this.margin, top + 10, {
      width: 220,
      height: textHeight,
      ellipsis: true,
      lineGap: 2,
    });
    doc.text(customerLines, this.pageWidth - this.margin - 220, top + 10, {
      width: 220,
      height: textHeight,
      ellipsis: true,
      align: "right",
      lineGap: 2,
    });
  }

  private addPageNumbers(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(this.muted).font("Helvetica").fontSize(8);
      doc.text(`Pagina ${i + 1}/${range.count}`, this.margin, this.pageNumberY, {
        width: this.contentWidth,
        align: "right",
        lineBreak: false,
      });
    }
  }

  private drawSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    const y = doc.y + 2;
    doc.rect(this.margin, y, this.contentWidth, 18).fill(this.soft);
    doc.fillColor(this.dark).font("Helvetica-Bold").fontSize(10.5);
    doc.text(title, this.margin + 8, y + 5);
    doc.y = y + 26;
  }

  private drawDetailsColumn(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    rows: Array<[string, string]>,
  ) {
    let rowY = y;
    const rowHeight = 28;
    rows.forEach(([label, value]) => {
      doc.fillColor(this.muted).font("Helvetica-Bold").fontSize(8.2);
      doc.text(label, x, rowY, { width });
      doc.fillColor(this.dark).font("Helvetica").fontSize(9.2);
      doc.text(value, x, rowY + 10, { width });
      rowY += rowHeight;
    });
    return rows.length * rowHeight;
  }

  private sumItems(items: WorkorderLineItem[]) {
    return items.reduce(
      (acc, item) => acc + item.qty * item.unitPrice - item.discount,
      0,
    );
  }

  private formatMoney(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  private formatQty(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  private formatDateTime(value?: Date | string | null) {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  private formatStatus(status?: string | null) {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      IN_PROGRESS: "Em andamento",
      DONE: "Concluida",
      CANCELED: "Cancelada",
    };

    return labels[String(status)] ?? this.valueOrDash(status);
  }

  private getInitials(name?: string | null) {
    const parts = String(name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return "OS";
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  }

  private valueOrDash(value?: string | null) {
    return value?.trim() || "-";
  }

  private resolveLocalAssetPath(assetUrl?: string | null) {
    if (!assetUrl) return null;

    const cleaned = String(assetUrl).trim();
    if (!cleaned) return null;

    if (/^https?:\/\//i.test(cleaned)) {
      return null;
    }

    const relativePath = cleaned.startsWith("/")
      ? cleaned.slice(1)
      : cleaned.replace(/^\.?[\\/]/, "");

    const absolutePath = path.join(process.cwd(), relativePath);
    return fs.existsSync(absolutePath) ? absolutePath : null;
  }

  private ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
    if (doc.y + needed > this.contentBottom) {
      doc.addPage();
      doc.y = this.margin;
    }
  }
}
