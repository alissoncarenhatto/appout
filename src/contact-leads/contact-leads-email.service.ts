import { Injectable, Logger } from "@nestjs/common";
import * as net from "net";
import * as tls from "tls";

type LeadLike = {
  name: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  score: number;
  sourcePage?: string | null;
  sourceUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class ContactLeadsEmailService {
  private readonly logger = new Logger(ContactLeadsEmailService.name);

  async notifyNewLead(lead: LeadLike) {
    const to = (process.env.CONTACT_LEAD_NOTIFY_EMAIL ?? "").trim();
    const host = (process.env.SMTP_HOST ?? "").trim();

    if (!to || !host) {
      return;
    }

    const from =
      (process.env.CONTACT_LEAD_FROM_EMAIL ?? process.env.SMTP_USER ?? "").trim();
    if (!from) {
      this.logger.warn("Skipping lead email because sender address is missing");
      return;
    }

    const fromName = (process.env.CONTACT_LEAD_FROM_NAME ?? "AppOut").trim();
    const payload = {
      from: `${fromName} <${from}>`,
      to,
      subject: `Novo contato no site: ${lead.name}`,
      text: this.buildPlainText(lead),
      html: this.buildHtml(lead),
    };

    try {
      await this.sendMail(payload);
    } catch (error) {
      this.logger.error(
        `Failed to send contact lead email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private buildPlainText(lead: LeadLike) {
    return [
      "Novo contato recebido no site",
      "",
      `Nome: ${lead.name}`,
      `Empresa: ${lead.companyName ?? "-"}`,
      `Email: ${lead.email}`,
      `Telefone: ${lead.phone ?? "-"}`,
      `Score: ${lead.score}`,
      `Status: ${lead.status}`,
      `Pagina: ${lead.sourcePage ?? "-"}`,
      `URL: ${lead.sourceUrl ?? "-"}`,
      `UTM Source: ${lead.utmSource ?? "-"}`,
      `UTM Medium: ${lead.utmMedium ?? "-"}`,
      `UTM Campaign: ${lead.utmCampaign ?? "-"}`,
      `UTM Content: ${lead.utmContent ?? "-"}`,
      `UTM Term: ${lead.utmTerm ?? "-"}`,
      `IP: ${lead.ipAddress ?? "-"}`,
      `User-Agent: ${lead.userAgent ?? "-"}`,
      "",
      "Mensagem:",
      lead.message,
    ].join("\n");
  }

  private buildHtml(lead: LeadLike) {
    const esc = (value: string | null | undefined) =>
      String(value ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const row = (label: string, value: string | null | undefined) =>
      `<tr><td style="padding:6px 0;color:#667085;"><strong>${esc(label)}</strong></td><td style="padding:6px 0;color:#101828;">${esc(value)}</td></tr>`;

    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#101828">
        <h2 style="margin:0 0 16px">Novo contato recebido no site</h2>
        <table cellpadding="0" cellspacing="0" border="0">
          ${row("Nome", lead.name)}
          ${row("Empresa", lead.companyName)}
          ${row("Email", lead.email)}
          ${row("Telefone", lead.phone)}
          ${row("Score", String(lead.score))}
          ${row("Status", lead.status)}
          ${row("Pagina", lead.sourcePage)}
          ${row("URL", lead.sourceUrl)}
          ${row("UTM Source", lead.utmSource)}
          ${row("UTM Medium", lead.utmMedium)}
          ${row("UTM Campaign", lead.utmCampaign)}
          ${row("UTM Content", lead.utmContent)}
          ${row("UTM Term", lead.utmTerm)}
          ${row("IP", lead.ipAddress)}
          ${row("User-Agent", lead.userAgent)}
        </table>
        <div style="margin-top:20px">
          <strong>Mensagem</strong>
          <div style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0">${esc(lead.message)}</div>
        </div>
      </div>
    `;
  }

  private async sendMail(payload: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    const host = (process.env.SMTP_HOST ?? "").trim();
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure =
      (process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465;
    const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS ?? 20000);
    const authUser = (process.env.SMTP_USER ?? "").trim();
    const authPass = (process.env.SMTP_PASS ?? "").trim();
    const helo = (process.env.SMTP_HELO_DOMAIN ?? "localhost").trim();

    const socket = secure
      ? tls.connect({ host, port, servername: host, timeout: timeoutMs })
      : net.connect({ host, port, timeout: timeoutMs });

    await new Promise<void>((resolve, reject) => {
      const eventName: "connect" | "secureConnect" = secure
        ? "secureConnect"
        : "connect";
      (socket as any).once(eventName, resolve);
      socket.once("error", reject);
    });

    const readResponse = async () => {
      let buffer = "";
      return new Promise<{ code: number; lines: string[] }>((resolve, reject) => {
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/).filter(Boolean);
          const last = lines[lines.length - 1];
          if (!last || !/^\d{3}[\s-]/.test(last)) return;

          const code = Number(last.slice(0, 3));
          if (last[3] === "-") return;
          socket.off("data", onData);
          resolve({ code, lines });
        };
        socket.on("data", onData);
        socket.once("error", reject);
      });
    };

    const send = async (command: string, expected: number[] = [250, 251, 354]) => {
      socket.write(`${command}\r\n`);
      const response = await readResponse();
      if (!expected.includes(response.code)) {
        throw new Error(`SMTP ${command} failed: ${response.lines.join(" | ")}`);
      }
      return response;
    };

    try {
      const greeting = await readResponse();
      if (greeting.code !== 220) {
        throw new Error(`SMTP connection failed: ${greeting.lines.join(" | ")}`);
      }

      const ehlo = await send(`EHLO ${helo}`, [250]);
      const supportsStartTls = ehlo.lines.some((line) =>
        line.toUpperCase().includes("STARTTLS"),
      );

      if (
        !secure &&
        supportsStartTls &&
        (process.env.SMTP_DISABLE_STARTTLS ?? "").toLowerCase() !== "true"
      ) {
        await send("STARTTLS", [220]);
        const upgraded = tls.connect({
          socket: socket as net.Socket,
          servername: host,
          timeout: timeoutMs,
        });

        await new Promise<void>((resolve, reject) => {
          (upgraded as any).once("secureConnect", resolve);
          upgraded.once("error", reject);
        });

        return this.sendThroughSocket(upgraded, payload, authUser, authPass, helo);
      }

      return this.sendThroughSocket(socket, payload, authUser, authPass, helo);
    } finally {
      if (!socket.destroyed) {
        socket.destroy();
      }
    }
  }

  private async sendThroughSocket(
    socket: net.Socket | tls.TLSSocket,
    payload: { from: string; to: string; subject: string; text: string; html?: string },
    authUser: string,
    authPass: string,
    helo: string,
  ) {
    const readResponse = async () => {
      let buffer = "";
      return new Promise<{ code: number; lines: string[] }>((resolve, reject) => {
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/).filter(Boolean);
          const last = lines[lines.length - 1];
          if (!last || !/^\d{3}[\s-]/.test(last)) return;

          const code = Number(last.slice(0, 3));
          if (last[3] === "-") return;
          socket.off("data", onData);
          resolve({ code, lines });
        };
        socket.on("data", onData);
        socket.once("error", reject);
      });
    };

    const send = async (command: string, expected: number[] = [250, 251, 354]) => {
      socket.write(`${command}\r\n`);
      const response = await readResponse();
      if (!expected.includes(response.code)) {
        throw new Error(`SMTP ${command} failed: ${response.lines.join(" | ")}`);
      }
      return response;
    };

    await send(`EHLO ${helo}`, [250]);

    if (authUser && authPass) {
      try {
        await send(
          `AUTH PLAIN ${Buffer.from(`\0${authUser}\0${authPass}`).toString("base64")}`,
          [235, 503],
        );
      } catch {
        await send("AUTH LOGIN", [334]);
        await send(Buffer.from(authUser).toString("base64"), [334]);
        await send(Buffer.from(authPass).toString("base64"), [235]);
      }
    }

    await send(`MAIL FROM:<${this.extractEmail(payload.from)}>`, [250]);
    await send(`RCPT TO:<${payload.to}>`, [250, 251]);
    await send("DATA", [354]);

    socket.write(`${this.buildMimeMessage(payload)}\r\n.\r\n`);
    const response = await readResponse();
    if (response.code !== 250) {
      throw new Error(`SMTP DATA failed: ${response.lines.join(" | ")}`);
    }

    await send("QUIT", [221]);
  }

  private buildMimeMessage(payload: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    const boundary = `----appout-${Date.now().toString(36)}`;
    const headers = [
      `From: ${payload.from}`,
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      "MIME-Version: 1.0",
    ];

    if (payload.html) {
      headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      return [
        ...headers,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        payload.text,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "",
        payload.html,
        "",
        `--${boundary}--`,
      ].join("\r\n");
    }

    headers.push("Content-Type: text/plain; charset=UTF-8");
    return [...headers, "", payload.text].join("\r\n");
  }

  private extractEmail(from: string) {
    const match = from.match(/<([^>]+)>/);
    return (match?.[1] ?? from).trim();
  }
}
