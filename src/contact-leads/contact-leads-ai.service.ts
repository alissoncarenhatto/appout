import { Injectable, Logger } from "@nestjs/common";
import { contact_lead_status } from "@prisma/client";

export interface LeadClassification {
  status: contact_lead_status;
  confidence: number;
  reason: string;
  model: string | null;
  source: "ai" | "rule";
}

@Injectable()
export class ContactLeadsAiService {
  private readonly logger = new Logger(ContactLeadsAiService.name);

  private normalizeConfidence(value: unknown) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  private fallbackClassification(data: {
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
    message: string;
    website?: string | null;
  }): LeadClassification {
    const text = [
      data.name,
      data.companyName ?? "",
      data.email,
      data.phone ?? "",
      data.message,
    ]
      .join(" ")
      .toLowerCase();

    const spam =
      Boolean(data.website?.trim()) ||
      /(viagra|casino|loan|crypto|bet now|essay|seo service|backlink)/.test(
        text,
      ) ||
      data.message.length < 10;

    if (spam) {
      return {
        status: contact_lead_status.SPAM,
        confidence: 0.9,
        reason: "Classificado como spam por sinais de risco básicos.",
        model: null,
        source: "rule",
      };
    }

    const qualified =
      /(orçamento|orcamento|proposta|cotação|cotacao|demo|demonstração|demonstracao|reuni[aã]o|agenda|preço|preco)/.test(
        text,
      ) || Boolean(data.phone) || Boolean(data.companyName);

    return {
      status: qualified
        ? contact_lead_status.QUALIFIED
        : contact_lead_status.NEW,
      confidence: qualified ? 0.72 : 0.58,
      reason: qualified
        ? "Lead com sinais comerciais fortes e potencial de conversão."
        : "Lead válido, mas com sinais ainda neutros para comercial.",
      model: null,
      source: "rule",
    };
  }

  async classify(data: {
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
    message: string;
    sourceUrl?: string | null;
    sourcePage?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;
    website?: string | null;
  }): Promise<LeadClassification> {
    const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
    if (!apiKey) {
      return this.fallbackClassification(data);
    }

    const model = (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();
    const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").trim();
    const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 15000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content:
                "You are a lead qualification classifier for a public landing page. Return only JSON with keys status, confidence, reason. status must be one of NEW, CONTACTED, QUALIFIED, DISQUALIFIED, SPAM. confidence is a number from 0 to 1. reason is a short sentence in Portuguese.",
            },
            {
              role: "user",
              content: JSON.stringify({
                name: data.name,
                companyName: data.companyName ?? null,
                email: data.email,
                phone: data.phone ?? null,
                message: data.message,
                sourceUrl: data.sourceUrl ?? null,
                sourcePage: data.sourcePage ?? null,
                utmSource: data.utmSource ?? null,
                utmMedium: data.utmMedium ?? null,
                utmCampaign: data.utmCampaign ?? null,
                utmContent: data.utmContent ?? null,
                utmTerm: data.utmTerm ?? null,
              }),
            },
          ],
          text: { format: { type: "json_object" } },
        }),
      });

      if (!response.ok) {
        this.logger.warn(`AI classification failed with status ${response.status}`);
        return this.fallbackClassification(data);
      }

      const payload: any = await response.json();
      const rawText =
        payload?.output_text ??
        payload?.output?.[0]?.content?.[0]?.text ??
        payload?.output?.[0]?.content?.[0]?.value ??
        null;

      if (!rawText) {
        return this.fallbackClassification(data);
      }

      const parsed = JSON.parse(String(rawText));
      const status = String(parsed.status ?? "").toUpperCase();
      const allowed = new Set(Object.values(contact_lead_status));

      return {
        status: allowed.has(status as contact_lead_status)
          ? (status as contact_lead_status)
          : contact_lead_status.NEW,
        confidence: this.normalizeConfidence(parsed.confidence),
        reason: String(parsed.reason ?? "Classificação gerada por IA."),
        model,
        source: "ai",
      };
    } catch (error) {
      this.logger.warn(
        `AI classification unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.fallbackClassification(data);
    } finally {
      clearTimeout(timeout);
    }
  }
}
