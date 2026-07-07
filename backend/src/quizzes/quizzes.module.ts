import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { QuizzesBattleGateway } from './quizzes-battle.gateway';

/**
 * QuizzesModule compiles the controllers and providers for quiz management.
 * Imports PrismaModule (for database operations) and AiModule (for AI services).
 * Registers QuizzesBattleGateway for real-time multiplayer WebSocket connections.
 * 
 * QuizzesModule ले quiz operations का लागि आवश्यक controllers, service र dependencies लाई combine गर्छ।
 * यसमा real-time multiplayer का लागि QuizzesBattleGateway पनि register गरिएको छ।
 */
@Module({
  imports: [PrismaModule, AiModule, UsersModule, AuthModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizzesBattleGateway],
})
export class QuizzesModule {}
