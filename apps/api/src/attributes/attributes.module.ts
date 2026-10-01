import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AttributesController],
  providers: [AttributesService, PrismaService],
  exports: [AttributesService],
})
export class AttributesModule {}
