import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    }
    return this.prisma.attribute.create({ 
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type || 'SELECT',
        isVisible: data.isVisible !== false,
        isFilterable: data.isFilterable || false,
        sortOrder: data.sortOrder || 0,
      } 
    });
  }

  async findAll() {
    return this.prisma.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const attribute = await this.prisma.attribute.findUnique({ 
      where: { id },
      include: {
        values: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    if (!attribute) throw new NotFoundException('Attributo non trovato');
    return attribute;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.attribute.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        isVisible: data.isVisible,
        isFilterable: data.isFilterable,
        sortOrder: data.sortOrder,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.attribute.delete({ where: { id } });
  }

  async createValue(attributeId: string, data: any) {
    await this.findOne(attributeId);
    return this.prisma.attributeValue.create({
      data: {
        attributeId,
        value: data.value,
        color: data.color,
        image: data.image,
        sortOrder: data.sortOrder || 0,
      }
    });
  }

  async removeValue(valueId: string) {
    return this.prisma.attributeValue.delete({ where: { id: valueId } });
  }
}
