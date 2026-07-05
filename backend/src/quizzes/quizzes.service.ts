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

  /**
   * Calculates global leaderboard rankings based on average score and completed quizzes.
   * 
   * Global leaderboard rankings calculate गर्छ - average score र completed quizzes को आधारमा।
   * 
   * @returns Top 10 user rankings (शीर्ष १० user हरूको र्‍याङ्किङ)
   */
  async getLeaderboard() {
    this.logger.log('Calculating global leaderboard rankings');
    try {
      // Fetch all users with their attempts to calculate averages
      // सबै user हरू र तिनीहरूका attempts database बाट तान्ने
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          attempts: {
            select: {
              score: true,
            },
          },
        },
      });

      const rankings = users
        .map((user) => {
          const totalCompleted = user.attempts.length;
          const averageScore =
            totalCompleted > 0
              ? Math.round(user.attempts.reduce((sum, a) => sum + a.score, 0) / totalCompleted)
              : 0;

          return {
            userId: user.id,
            name: user.name,
            totalCompleted,
            averageScore,
          };
        })
        // Only show users who have actually taken at least one quiz
        // कम्तीमा एउटा quiz खेलेका user हरूलाई मात्र leaderboard मा देखाउने
        .filter((u) => u.totalCompleted > 0)
        // Sort by average score first, then by total completed quizzes
        // पहिले average score, त्यसपछि total quizzes completed को आधारमा sort गर्ने
        .sort((a, b) => {
          if (b.averageScore !== a.averageScore) {
            return b.averageScore - a.averageScore;
          }
          return b.totalCompleted - a.totalCompleted;
        })
        .slice(0, 10); // Return top 10

      return rankings;
    } catch (error) {
      this.logger.error('Failed to calculate leaderboard', error);
      throw new InternalServerErrorException(
        'Failed to load leaderboard | Leaderboard गणना गर्दा समस्या आयो',
      );
    }
  }

  /**
   * Aggregates user performance statistics grouped by topic, and fetches recent score progress.
   * 
   * User को performance analytics: बिषयगत (topic) बलियो पक्ष र हालसालैका attempts को score history।
   * 
   * @param userId The ID of the user (user को ID)
   * @returns Aggregated topic strengths and score trends (बिषयगत दक्षता र score progression)
   */
  async getPerformanceStats(userId: number) {
    this.logger.log(`Fetching performance statistics for user ${userId}`);
    try {
      const attempts = await this.prisma.attempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              topic: true,
            },
          },
        },
        orderBy: {
          completedAt: 'asc', // Ascending for progress timeline
        },
      });

      // 1. Calculate topic strengths (average score per topic)
      // प्रत्येक topic मा user को average score (दक्षता) calculate गर्ने
      const topicAggregates: Record<string, { totalScore: number; count: number }> = {};
      
      attempts.forEach((attempt) => {
        const topic = attempt.quiz.topic;
        if (!topicAggregates[topic]) {
          topicAggregates[topic] = { totalScore: 0, count: 0 };
        }
        topicAggregates[topic].totalScore += attempt.score;
        topicAggregates[topic].count += 1;
      });

      const strengths = Object.keys(topicAggregates).map((topic) => ({
        topic,
        averageScore: Math.round(topicAggregates[topic].totalScore / topicAggregates[topic].count),
        attemptsCount: topicAggregates[topic].count,
      }));

      // Sort strengths to display strongest first
      // सबैभन्दा बढी score ल्याएको topic लाई पहिले राख्ने गरी sort गर्ने
      strengths.sort((a, b) => b.averageScore - a.averageScore);

      // 2. Score progression trend (limit to last 6 attempts for chart sizing)
      // हालसालैका बढीमा ६ वटा attempts को score progression history
      const history = attempts.slice(-6).map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        completedAt: attempt.completedAt,
        quizTitle: attempt.quiz.topic,
      }));

      return {
        strengths,
        history,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate performance stats for user ${userId}`, error);
      throw new InternalServerErrorException(
        'Failed to compile performance stats | Performance analytics तयार पार्दा समस्या आयो',
      );
    }
  }
}
