import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  // Fail-fast security validation
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET environment variable is missing in production!');
      process.exit(1);
    } else {
      console.warn('[SECURITY WARNING] JWT_SECRET is not defined. Ensure .env is populated.');
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global exception filter for unified enterprise responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Set global API prefix
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3002',
    ].filter(Boolean),
    credentials: true,
  });

  // Serve static files from uploads folder (local fallback)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}
bootstrap();
