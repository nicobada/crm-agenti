import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
  ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common';
import { ProductsService, CreateProductDto } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(100), ParseIntPipe) take?: number,
  ) {
    // Public list (all authenticated users) — only active products
    return this.productsService.findAll({ search, category, isActive: true, skip, take });
  }

  // Admin sees all (including inactive)
  @Get('all')
  findAllAdmin(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(100), ParseIntPipe) take?: number,
    @Req() req?: any,
  ) {
    return this.productsService.findAll({ search, category, skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(dto, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>, @Req() req: any) {
    return this.productsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user);
  }
}
