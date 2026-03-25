import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { I18nService } from "src/i18n/i18n.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "super-secret",
    });
  }

  async validate(payload: any) {
    const id = BigInt(String(payload.sub));

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, tenant: true },
    });

    if (!user) return null;
    const business = this.i18n.getBusinessConfig(
      user.tenant?.country,
      user.tenant?.defaultLocale,
    );

    return {
      sub: user.id.toString(),
      userId: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role?.name ?? null,
      locale: this.i18n.resolveUserLocale(
        user.locale,
        user.tenant?.defaultLocale,
        user.tenant?.country,
      ),
      language: this.i18n.getLanguage(user.locale),
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      tenantName: user.tenant?.name ?? null,
      country: business.country,
      currency: business.currency,
      defaultLocale: business.defaultLocale,
    };
  }
}
