import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true, agent: true },
    });
    if (!user) throw new UnauthorizedException('Credenziali non valide');

    // FIX: usa passwordHash invece di password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Credenziali non valide');

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const roles = user.roles?.map((r: any) => r.name) || [];
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      agentId: user.agent?.id || null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        agentId: user.agent?.id || null,
      },
    };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      delete payload.iat;
      delete payload.exp;
      return {
        access_token: this.jwtService.sign(payload),
        user: payload,
      };
    } catch {
      throw new UnauthorizedException('Token non valido');
    }
  }
}
