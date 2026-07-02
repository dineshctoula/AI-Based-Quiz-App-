import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Generates a new quiz using AI and stores it in the database.
   * 
   * AI को मद्दतले नयाँ quiz बनाउँछ र त्यसलाई database मा save गर्छ।
   * 
   * @param userId ID of the user creating the quiz (user को ID)
   * @param dto Input payload containing topic, difficulty, and count (topic, difficulty र questions count)
   * @returns The created quiz with questions included (बनेको quiz र त्यसका questions हरू)
   */
  async generateQuiz(userId: number, dto: GenerateQuizDto) {
    const { topic, difficulty, count } = dto;
    this.logger.log(
      `Starting quiz generation for user ${userId}. Topic: "${topic}", Difficulty: "${difficulty}", Count: ${count}`,
    );

    try {
      // 1. Generate questions using AiService
      // AiService बाट questions generate गर्ने
      const questions = await this.aiService.generateQuestions(topic, difficulty, count);

      if (!questions || questions.length === 0) {
        throw new Error('AI service failed to generate questions.');
      }

      // 2. Save quiz and questions to database atomically
      // Quiz र Questions लाई database मा transaction / nested write मार्फत save गर्ने
      // 30 seconds per question is allocated as the time limit
      const timeLimit = count * 30; 

      const createdQuiz = await this.prisma.quiz.create({
        data: {
          title: `AI Quiz: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
          description: `AI-generated quiz testing your knowledge on "${topic}" under ${difficulty} level.`,
          topic: topic,
          difficulty: difficulty,
          timeLimit: timeLimit,
          creatorId: userId,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      this.logger.log(`Successfully generated and saved quiz ID: ${createdQuiz.id} with ${createdQuiz.questions.length} questions.`);
      return createdQuiz;
    } catch (error) {
      this.logger.error(`Failed to generate quiz for user ${userId}`, error);
      throw new InternalServerErrorException(
        error.message || 'An error occurred during quiz generation | Quiz generate गर्दा केही समस्या आयो',
      );
    }
  }
}
