import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * QuizzesController handles incoming HTTP requests related to quizzes.
 * Exposes endpoint to generate new quizzes using AI under JWT protection.
 * 
 * QuizzesController ले quiz सँग सम्बन्धित HTTP requests हरू handle गर्छ।
 * यसमा user login भएको हुनुपर्छ (JwtAuthGuard)।
 */
@Controller('quizzes')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  /**
   * Endpoint to generate and save a quiz.
   * POST /api/quizzes/generate
   * 
   * AI को मद्दतले quiz generate गरेर database मा save गर्ने endpoint.
   * 
   * @param user The authenticated user object injected by CurrentUser decorator (login भएको user)
   * @param dto The quiz generation preferences (topic, difficulty, count)
   */
  @Post('generate')
  async generateQuiz(
    @CurrentUser() user: { id: number; email: string },
    @Body() dto: GenerateQuizDto,
  ) {
    return this.quizzesService.generateQuiz(user.id, dto);
  }
}
