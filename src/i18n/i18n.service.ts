import { Injectable } from "@nestjs/common";
import { COUNTRY_CONFIG, PDF_TRANSLATIONS } from "./i18n.constants";

@Injectable()
export class I18nService {
  private readonly fallbackCountry = "BR";
  private readonly fallbackLocale = "pt-BR";

  normalizeCountry(country?: string | null) {
    const normalized = String(country ?? this.fallbackCountry)
      .trim()
      .toUpperCase();

    return COUNTRY_CONFIG[normalized] ? normalized : this.fallbackCountry;
  }

  normalizeLocale(
    locale?: string | null,
    fallbackLocale?: string | null,
    country?: string | null,
  ) {
    const fallback =
      fallbackLocale ||
      COUNTRY_CONFIG[this.normalizeCountry(country)].defaultLocale ||
      this.fallbackLocale;

    const raw = String(locale ?? fallback)
      .trim()
      .replace("_", "-");

    if (!raw) return fallback;

    const lower = raw.toLowerCase();

    if (lower.startsWith("en")) return "en-US";
    if (lower.startsWith("es")) {
      const normalizedCountry = this.normalizeCountry(country);
      if (["AR", "ES", "MX", "PY"].includes(normalizedCountry)) {
        return COUNTRY_CONFIG[normalizedCountry].defaultLocale;
      }
      return "es-ES";
    }
    if (lower.startsWith("pt")) {
      const normalizedCountry = this.normalizeCountry(country);
      if (normalizedCountry === "PT") return "pt-PT";
      return "pt-BR";
    }

    return fallback;
  }

  resolveUserLocale(
    userLocale?: string | null,
    tenantDefaultLocale?: string | null,
    country?: string | null,
  ) {
    return this.normalizeLocale(userLocale, tenantDefaultLocale, country);
  }

  getLanguage(locale?: string | null) {
    const normalized = this.normalizeLocale(locale);
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("es")) return "es";
    return "pt";
  }

  getBusinessConfig(country?: string | null, locale?: string | null) {
    const normalizedCountry = this.normalizeCountry(country);
    const config = COUNTRY_CONFIG[normalizedCountry];

    return {
      country: normalizedCountry,
      currency: config.currency,
      defaultLocale: config.defaultLocale,
      locale: this.normalizeLocale(locale, config.defaultLocale, normalizedCountry),
      language: this.getLanguage(locale || config.defaultLocale),
    };
  }

  resolveCurrency(country?: string | null) {
    return this.getBusinessConfig(country).currency;
  }

  formatMoney(value: number, locale?: string | null, country?: string | null) {
    const business = this.getBusinessConfig(country, locale);

    return new Intl.NumberFormat(business.locale, {
      style: "currency",
      currency: business.currency,
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  formatQty(value: number, locale?: string | null) {
    return new Intl.NumberFormat(this.normalizeLocale(locale), {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  formatDateTime(value?: Date | string | null, locale?: string | null) {
    if (!value) return "-";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat(this.normalizeLocale(locale), {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  tPdf(key: string, locale?: string | null) {
    const lang = this.getLanguage(locale);
    return PDF_TRANSLATIONS[lang]?.[key] ?? PDF_TRANSLATIONS.pt[key] ?? key;
  }

  translateStatus(status?: string | null, locale?: string | null) {
    const map: Record<string, string> = {
      CANCELED: this.tPdf("canceled", locale),
      DONE: this.tPdf("completed", locale),
      IN_PROGRESS: locale?.startsWith("en")
        ? "In progress"
        : locale?.startsWith("es")
          ? "En progreso"
          : "Em andamento",
      PENDING: this.tPdf("pending", locale),
    };

    return map[String(status)] ?? (status?.trim() || "-");
  }
}
