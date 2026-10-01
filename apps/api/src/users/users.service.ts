import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        isActive: true, createdAt: true,
        roles: { select: { id: true, name: true } },
        agent: { select: { id: true, code: true } },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { permissions: true } },
        agent: true,
      },
    });
    if (!user) throw new NotFoundException('Utente non trovato');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email già registrata');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: dto.roleIds ? { connect: dto.roleIds.map((id) => ({ id })) } : undefined,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        roles: { select: { name: true } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password;
    }
    if (dto.roleIds) {
      data.roles = { set: dto.roleIds.map((id) => ({ id })) };
      delete data.roleIds;
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
