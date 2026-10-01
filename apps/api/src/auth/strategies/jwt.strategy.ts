import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be defined in production environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'dev-fallback-key-only-for-local-testing',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: { include: { permissions: true } },
        agent: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utente non valido o disattivato');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      agentId: user.agent?.id || null,
      agent: user.agent,
      permissions: user.roles.flatMap((r) => r.permissions),
    };
  }
}
