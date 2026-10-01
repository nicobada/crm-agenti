import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgentsModule } from './agents/agents.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module'; // Import già presente
import { OrdersModule } from './orders/orders.module';
import { CommissionsModule } from './commissions/commissions.module';
import { DocumentsModule } from './documents/documents.module';
import { StorageModule } from './storage/storage.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogsModule } from './logs/logs.module';
import { CategoriesModule } from './categories/categories.module';
import { AttributesModule } from './attributes/attributes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AgentsModule,
    ClientsModule,
    ProductsModule, // Assicurati che questa riga sia qui
    OrdersModule,
    CommissionsModule,
    DocumentsModule,
    StorageModule,
    LogsModule,
    CategoriesModule,
    AttributesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}