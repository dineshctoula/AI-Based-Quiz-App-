import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

// मुख्य entry point function (server start गर्ने ठाउँ)
async function bootstrap() {

  // NestJS app create गर्दै AppModule बाट
  const app = await NestFactory.create(AppModule);

  // HTTP Header सुरक्षा बढाउन Helmet प्रयोग गर्ने (Use Helmet to secure HTTP headers)
  // HTTP security header हरू थपेर application लाई बढी सुरक्षित बनाउन helmet register गर्ने
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // सबै routes अगाडि '/api' prefix थप्ने (जस्तै /api/users)
  app.setGlobalPrefix('api');

  // Global Exception Filter apply गर्ने
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation validation pipes globally apply गर्ने
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS config: production मा production frontend url र dev मा local urls (CORS enable configuration)
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? frontendUrl
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // Port set गर्ने (environment variable छ भने त्यही, नभए 5000)
  const port = process.env.PORT ?? 5000;

  // Server start गर्ने
  await app.listen(port);

  // Console मा server चलिरहेको जानकारी देखाउने
  console.log(`Application is running on: http://localhost:${port}/api`);
}

// bootstrap function call गरेर app start गर्ने
bootstrap();