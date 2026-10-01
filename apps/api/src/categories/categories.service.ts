import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Generate a simple slug if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8);
    }
    return this.prisma.category.create({ data });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getTree() {
    // Fetch all categories
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    // Build tree
    const categoryMap = new Map();
    const tree: any[] = [];
    
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node); // Parent not found, add to root
        }
      } else {
        tree.push(node);
      }
    });
    
    return tree;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria non trovata');
    return category;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
