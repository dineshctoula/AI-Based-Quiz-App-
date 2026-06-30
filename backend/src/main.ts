import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// मुख्य entry point function (server start गर्ने ठाउँ)
async function bootstrap() {

  // NestJS app create गर्दै AppModule बाट
  const app = await NestFactory.create(AppModule);

  // सबै routes अगाडि '/api' prefix थप्ने (जस्तै /api/users)
  app.setGlobalPrefix('api');

  // Validation validation pipes globally apply गर्ने
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS enable गर्ने (frontend र backend अलग server भए पनि connect गर्न)
  app.enableCors();

  // Port set गर्ने (environment variable छ भने त्यही, नभए 5000)
  const port = process.env.PORT ?? 5000;

  // Server start गर्ने
  await app.listen(port);

  // Console मा server चलिरहेको जानकारी देखाउने
  console.log(`Application is running on: http://localhost:${port}/api`);
}

// bootstrap function call गरेर app start गर्ने
bootstrap();