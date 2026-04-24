import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { contact_lead_status, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ContactLeadsAiService } from "./contact-leads-ai.service";
import { ContactLeadsEmailService } from "./contact-leads-email.service";
import { ContactLeadListStatus } from "./dto/list-contact-lead-query.dto";

@Injectable()
export class ContactLeadsService {
  private readonly logger = new Logger(ContactLeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: ContactLeadsEmailService,
    private readonly aiService: ContactLeadsAiService,
  ) {}

  private ensureSystemAdmin(user: any) {
    if ((user?.role ?? "").toString() !== "SYSTEM_ADMIN") {
      throw new ForbiddenException("Not allowed");
    }
  }

  private normalizeScore(score: number) {
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private scoreLead(data: {
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
    message: string;
    sourcePage?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;
    website?: string | null;
  }) {
    const text = [
      data.name,
      data.companyName ?? "",
      data.email,
      data.phone ?? "",
      data.message,
      data.sourcePage ?? "",
      data.utmSource ?? "",
      data.utmMedium ?? "",
      data.utmCampaign ?? "",
      data.utmContent ?? "",
      data.utmTerm ?? "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 20;
    score += data.companyName ? 10 : 0;
    score += data.phone ? 15 : 0;
    score += data.message.length > 80 ? 10 : 0;
    score += data.message.length > 200 ? 10 : 0;
    score += /orçamento|orcamento|proposta|cotação|cotacao|demo|demonstração|demonstracao|agenda|reuni[aã]o|preço|preco/.test(text)
      ? 20
      : 0;
    score += /whatsapp|telefone|ligar|call back|retornar/.test(text) ? 10 : 0;
    score += /@gmail\.com|@hotmail\.com|@outlook\.com|@yahoo\.com/.test(data.email)
      ? 0
      : 5;
    score += data.website ? -60 : 0;
    score += /(http:\/\/|https:\/\/|www\.)/.test(text) ? -15 : 0;
    return this.normalizeScore(score);
  }

  private isSpamLead(data: { message: string; website?: string | null; email: string }) {
    const text = `${data.message} ${data.email}`.toLowerCase();
    const spamSignals = [
      Boolean(data.website?.trim()),
      /(viagra|casino|loan|crypto|bet now|essay|seo service|backlink)/.test(text),
      (text.match(/https?:\/\//g) ?? []).length > 1,
      data.message.length < 10,
    ];
    return spamSignals.filter(Boolean).length >= 2;
  }

  private classifyStatus(score: number, isSpam: boolean) {
    if (isSpam) return contact_lead_status.SPAM;
    if (score >= 80) return contact_lead_status.QUALIFIED;
    return contact_lead_status.NEW;
  }

  private decimalToNumber(value: any) {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private parseDate(value?: string | null) {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  async create(
    data: any,
    reqMeta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const score = this.scoreLead(data);
    const isSpam = this.isSpamLead(data);
    const ai = await this.aiService.classify(data);
    const status = ai.status ?? this.classifyStatus(score, isSpam);

    const created = await this.prisma.contactLead.create({
      data: {
        name: data.name.trim(),
        companyName: data.companyName?.trim() || null,
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        message: data.message.trim(),
        sourceUrl: data.sourceUrl?.trim() || null,
        sourcePage: data.sourcePage?.trim() || null,
        utmSource: data.utmSource?.trim() || null,
        utmMedium: data.utmMedium?.trim() || null,
        utmCampaign: data.utmCampaign?.trim() || null,
        utmContent: data.utmContent?.trim() || null,
        utmTerm: data.utmTerm?.trim() || null,
        status,
        score,
        aiStatus: ai.status,
        aiConfidence: ai.confidence,
        aiReason: ai.reason,
        classificationSource: ai.source.toUpperCase(),
        classificationModel: ai.model,
        ipAddress: reqMeta?.ipAddress ?? null,
        userAgent: reqMeta?.userAgent ?? null,
      },
    });

    void this.emailService.notifyNewLead(created).catch((error) => {
      this.logger.error(
        `Unexpected contact email failure: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return created;
  }

  async updateStatus(
    user: any,
    id: string | number | bigint,
    dto: { status?: contact_lead_status; notes?: string | null },
  ) {
    this.ensureSystemAdmin(user);

    const target = await this.prisma.contactLead.findUnique({
      where: { id: BigInt(String(id)) },
    });
    if (!target) throw new NotFoundException("Contact lead not found");

    return this.prisma.contactLead.update({
      where: { id: BigInt(String(id)) },
      data: {
        status: dto.status ?? target.status,
        notes:
          dto.notes !== undefined
            ? dto.notes?.trim() || null
            : target.notes,
      },
    });
  }

  async list(user: any, query: any) {
    this.ensureSystemAdmin(user);

    const page = Math.max(1, Number(query?.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query?.pageSize ?? 25)));
    const where: Prisma.contactLeadWhereInput = {};

    if (query?.q && String(query.q).trim() !== "") {
      const q = String(query.q).trim();
      where.OR = [
        { name: { contains: q } },
        { companyName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { message: { contains: q } },
      ];
    }

    if (query?.status) {
      where.status = query.status as ContactLeadListStatus;
    }

    if (query?.minScore !== undefined || query?.maxScore !== undefined) {
      where.score = {};
      if (query?.minScore !== undefined) where.score.gte = Number(query.minScore);
      if (query?.maxScore !== undefined) where.score.lte = Number(query.maxScore);
    }

    const from = this.parseDate(query?.from);
    const to = this.parseDate(query?.to);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [data, total] = await Promise.all([
      this.prisma.contactLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contactLead.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(user: any, id: string | number | bigint) {
    this.ensureSystemAdmin(user);

    const contactLead = await this.prisma.contactLead.findUnique({
      where: { id: BigInt(String(id)) },
    });
    if (!contactLead) throw new NotFoundException("Contact lead not found");
    return contactLead;
  }
}
