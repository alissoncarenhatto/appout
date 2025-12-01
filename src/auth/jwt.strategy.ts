import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
  }

  async validate(payload: any) {
    const id = BigInt(String(payload.sub));
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, tenant: true },
    });

    if (!user) return null;

    return {
      sub: user.id.toString(),
      userId: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role?.name ?? null,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
    };
  }
}
