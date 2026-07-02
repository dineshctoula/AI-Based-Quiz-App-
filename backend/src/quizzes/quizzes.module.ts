import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

/**
 * QuizzesModule compiles the controllers and providers for quiz management.
 * Imports PrismaModule (for database operations) and AiModule (for AI services).
 * 
 * QuizzesModule ले quiz operations का लागि आवश्यक controllers, service र dependencies लाई combine गर्छ।
 */
@Module({
  imports: [PrismaModule, AiModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
