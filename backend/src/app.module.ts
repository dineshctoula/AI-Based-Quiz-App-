import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

/**
 * AppModule is the root module of the application.
 * Configures the ConfigModule globally to handle environment variables.
 * 
 * AppModule ले सम्पूर्ण backend app का module हरू र global configuration load गर्छ।
 */
@Module({
  imports: [
    // Load environmental variables globally
    // environment variables (.env file) लाई global configuration मा setup गर्ने
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
