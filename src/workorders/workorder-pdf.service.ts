import { Injectable } from "@nestjs/common";
import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import * as QRCode from "qrcode";

@Injectable()
export class WorkorderPdfService {
  async generate(workorder: any): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads", "workorders");
    fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `workorder-${workorder.id}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(fs.createWriteStream(filepath));

    /* ---------- HEADER ---------- */
    doc.fontSize(20).text("ORDEM DE SERVIÇO", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`OS Nº: ${workorder.id}`);
    doc.text(`Cliente: ${workorder.customer.name}`);
    doc.text(`Veículo: ${workorder.vehicle.plate}`);
    doc.text(`Status: ${workorder.status}`);
    doc.moveDown();

    /* ---------- SERVICES ---------- */
    doc.fontSize(14).text("Serviços");
    doc.moveDown(0.5);

    workorder.workorderservice.forEach((s) => {
      doc
        .fontSize(10)
        .text(`${s.qty}x ${s.servicecatalog.name} — R$ ${s.unitPrice}`, {
          indent: 10,
        });
    });

    doc.moveDown();

    /* ---------- PARTS ---------- */
    doc.fontSize(14).text("Peças");
    doc.moveDown(0.5);

    workorder.workorderpart.forEach((p) => {
      doc.fontSize(10).text(`${p.qty}x ${p.part.name} — R$ ${p.unitPrice}`, {
        indent: 10,
      });
    });

    doc.moveDown();

    /* ---------- TOTAL ---------- */
    const total =
      workorder.workorderservice.reduce((a, s) => a + s.unitPrice * s.qty, 0) +
      workorder.workorderpart.reduce((a, p) => a + p.unitPrice * p.qty, 0) -
      (workorder.discount ?? 0);

    doc.fontSize(14).text(`TOTAL: R$ ${total}`, { align: "right" });

    /* ---------- QR CODE ---------- */
    const publicUrl = `${process.env.API_URL}/uploads/workorders/${filename}`;
    const qr = await QRCode.toDataURL(publicUrl);

    doc.addPage();
    doc.fontSize(12).text("Acesse esta OS online:");
    doc.image(qr, { width: 150, align: "center" });

    doc.end();

    return `/uploads/workorders/${filename}`;
  }
}
