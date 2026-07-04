import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

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

  /**
   * Retrieves all quizzes in the database with their creator details and question count.
   * 
   * Database मा भएका सबै quiz हरू, तिनीहरूका creator र question count सहित तान्छ।
   * 
   * @returns List of all quizzes (सबै quiz हरूको सूची)
   */
  async findAll() {
    this.logger.log('Retrieving all quizzes');
    return this.prisma.quiz.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Retrieves a single quiz by ID, sanitizing questions to hide correct answers and explanations.
   * 
   * ID अनुसार एउटा quiz तान्छ, तर cheating रोक्न correct answers र explanations हटाउँछ।
   * 
   * @param id Quiz ID (क्विजको ID)
   * @returns Sanitized quiz details (संशोधित क्विज विवरण)
   */
  async findOne(id: number) {
    this.logger.log(`Retrieving sanitized quiz with ID: ${id}`);
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            // Exclude correctAnswer and explanation to prevent client inspection cheating
            // client-side inspection बाट cheating रोक्न correct answer र explanation लुकाइन्छ
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found | ID ${id} भएको quiz भेटिएन`);
    }

    return quiz;
  }

  /**
   * Grades a user's quiz attempt, calculates score, and stores the graded results.
   * 
   * User को quiz attempt लाई grade गर्छ, score calculate गर्छ र database मा save गर्छ।
   * 
   * @param userId The ID of the user submitting the attempt (प्रयास गर्ने user को ID)
   * @param quizId The ID of the quiz being attempted (दिन लागिएको quiz को ID)
   * @param dto The user's selections/responses (user ले रोजेका उत्तरहरू)
   * @returns The saved attempt with full graded feedback (grade गरिएको feedback सहितको attempt)
   */
  async submitAttempt(userId: number, quizId: number, dto: SubmitAttemptDto) {
    this.logger.log(`Grading attempt for user ${userId} on quiz ${quizId}`);
    
    // Fetch quiz with full question details containing correctAnswer/explanation
    // correct answer र explanation सहित full question details database बाट तान्ने
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found | ID ${quizId} भएको quiz भेटिएन`);
    }

    let correctCount = 0;

    // Grade each question response
    // प्रत्येक प्रश्नको उत्तर जाँच्ने
    const gradedAnswers = quiz.questions.map((question) => {
      const userAnswer = dto.answers.find((a) => a.questionId === question.id);
      const selectedOption = userAnswer ? userAnswer.selectedOption : '';
      
      const isCorrect = selectedOption.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: question.id,
        text: question.text,
        options: question.options,
        selectedOption,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isCorrect,
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Save attempt record in database
    // score र answers विवरण database मा Attempt model मा save गर्ने
    const attempt = await this.prisma.attempt.create({
      data: {
        score,
        userId,
        quizId,
        answers: gradedAnswers, // Saved as Json (Prisma schema support)
      },
      include: {
        quiz: {
          select: {
            title: true,
            topic: true,
          },
        },
      },
    });

    this.logger.log(`Attempt graded successfully for user ${userId}. Score: ${score}%`);
    return attempt;
  }

  /**
   * Retrieves all attempts made by a specific user.
   * 
   * कुनै निश्चित user ले दिएका सबै quiz attempts को history तान्छ।
   * 
   * @param userId The ID of the user (user को ID)
   * @returns User's quiz attempt history (user को quiz attempt history)
   */
  async findUserAttempts(userId: number) {
    this.logger.log(`Retrieving attempt history for user ${userId}`);
    return this.prisma.attempt.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }
}
