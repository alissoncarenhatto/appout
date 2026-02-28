import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, tenant: true },
    });

    if (!user) return null;

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) return null;

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.name,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      tenantName: user.tenant?.name ?? null,
      role: user.role?.name ?? null,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        tenantName: user.tenant?.name ?? null,
        role: user.role?.name ?? null,
        locale: user.locale,
      },
      tenant: {
        id: user.tenant?.id?.toString() ?? null,
        name: user.tenant?.name ?? null,
        country: user.tenant?.country ?? null,
        defaultLocale: user.tenant?.defaultLocale ?? null,
      },
    };
  }
}
