import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

// Riesportiamo i DTO per farli vedere al controller ed evitare TS2459
export { CreateProductDto, UpdateProductDto };

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: any = {}) {
    const { search, category, skip, take } = filters;
    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Prodotto non trovato');
    return product;
  }

  async create(dto: CreateProductDto, user?: any) {
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException(`SKU ${dto.sku} già esistente`);

    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description || null,
        basePrice: Number(dto.basePrice),
        category: dto.category || (dto.categoryId ? null : 'Altro'),
        categoryId: dto.categoryId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        stock: dto.stock !== undefined ? Number(dto.stock) : 0,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto, user?: any) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        basePrice: dto.basePrice !== undefined ? Number(dto.basePrice) : undefined,
        stock: dto.stock !== undefined ? Number(dto.stock) : undefined,
      },
    });
  }

  async remove(id: string, user?: any) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}