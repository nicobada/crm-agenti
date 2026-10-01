import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('attributes')
@UseGuards(JwtAuthGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createAttributeDto: any) {
    return this.attributesService.create(createAttributeDto);
  }

  @Get()
  findAll() {
    return this.attributesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() updateAttributeDto: any) {
    return this.attributesService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id') id: string) {
    return this.attributesService.remove(id);
  }

  // Values endpoints
  @Post(':id/values')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  createValue(@Param('id') attributeId: string, @Body() data: any) {
    return this.attributesService.createValue(attributeId, data);
  }

  @Delete('values/:valueId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  removeValue(@Param('valueId') valueId: string) {
    return this.attributesService.removeValue(valueId);
  }
}
