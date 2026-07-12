import { Injectable, InternalServerErrorException, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AskTutorDto } from './dto/ask-tutor.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  // In-memory rate limiting map: userId -> { count: number; lastReset: number }
  // user request rate limit गर्न in-memory structure
  private readonly tutorRequestCounts = new Map<number, { count: number; lastReset: number }>();

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

  /**
   * Delegates AI Tutor follow-up questions to AiService after applying rate limits.
   * 
   * AI Tutor को लागि request handle गर्छ, rate limiting check गर्छ र AiService लाई delegate गर्छ।
   */
  async askTutor(userId: number, quizId: number, dto: AskTutorDto) {
    const { questionId, message, history } = dto;
    this.logger.log(`User ${userId} asking tutor about question ${questionId} in quiz ${quizId}`);

    // Rate limiting check: Limit to 15 requests per hour per user
    // Rate limit check गर्ने: १ घण्टामा बढीमा १५ वटा प्रश्न
    const now = Date.now();
    const limit = 15;
    const windowMs = 60 * 60 * 1000;

    let userRecord = this.tutorRequestCounts.get(userId);
    if (!userRecord) {
      userRecord = { count: 0, lastReset: now };
      this.tutorRequestCounts.set(userId, userRecord);
    }

    if (now - userRecord.lastReset > windowMs) {
      userRecord.count = 0;
      userRecord.lastReset = now;
    }

    if (userRecord.count >= limit) {
      this.logger.warn(`User ${userId} exceeded rate limit for tutor`);
      throw new HttpException(
        'Rate limit exceeded. Max 15 queries per hour. | सीमा नाघ्यो। प्रति घण्टा बढीमा १५ वटा जिज्ञासा मात्र सोध्न सकिन्छ।',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify quiz and question existence
    // Quiz र Question exist गर्छ कि गर्दैन र related छ कि छैन जाँच्ने
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          where: { id: questionId },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found | Quiz भेटिएन`);
    }

    const question = quiz.questions[0];
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found in quiz ${quizId} | यो प्रश्न भेटिएन`);
    }

    // Check if user has attempted this quiz before querying AI Tutor
    // AI Tutor लाई प्रश्न सोध्नु अघि user ले यो quiz attempt गरेको हुनुपर्छ
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        userId,
        quizId,
      },
    });

    if (!attempt) {
      throw new HttpException(
        'You must attempt the quiz before asking the AI Tutor. | AI Tutor लाई सोध्नु अघि तपाईंले क्विजको प्रयास गरेको हुनुपर्छ।',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Extract selected answer from attempt's JSON answers structure
    // attempt.answers has structure: [{ questionId, selectedOption, isCorrect, explanation, correctAnswer }]
    const answersArray = attempt.answers as any[];
    const userAnswer = answersArray.find((ans: any) => ans.questionId === questionId);
    const selectedOption = userAnswer ? userAnswer.selectedOption : 'None';

    const questionContext = {
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      selectedOption,
      originalExplanation: question.explanation || '',
    };

    // Increment request count
    userRecord.count++;

    // Format history structure for AiService
    const formattedHistory = history.map((h) => ({
      role: h.role,
      text: h.text,
    }));

    const responseText = await this.aiService.askTutor(questionContext, message, formattedHistory);

    return {
      response: responseText,
    };
  }

  /**
   * Submits a report/flag on a quiz.
   * 
   * क्विजमा रिपोर्ट/फ्ल्याग दर्ता गर्छ।
   */
  async flagQuiz(userId: number, quizId: number, reason: string, comment?: string) {
    this.logger.log(`User ${userId} flagging quiz ${quizId} for reason: ${reason}`);
    
    const quizExists = await this.prisma.quiz.findUnique({
      where: { id: quizId }
    });
    if (!quizExists) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found | ID ${quizId} भएको क्विज भेटिएन`);
    }

    return this.prisma.flag.create({
      data: {
        userId,
        quizId,
        reason,
        comment
      }
    });
  }

  /**
   * Retrieves system-wide stats for admin dashboard.
   * 
   * Admin dashboard को लागि सम्पूर्ण प्रणालीको तथ्याङ्क तान्छ।
   */
  async getAdminStats() {
    this.logger.log('Fetching system-wide admin stats');
    try {
      const totalUsers = await this.prisma.user.count();
      const totalQuizzes = await this.prisma.quiz.count();
      const totalAttempts = await this.prisma.attempt.count();
      const totalFlags = await this.prisma.flag.count({ where: { resolved: false } });

      const attempts = await this.prisma.attempt.findMany({
        select: { score: true }
      });
      const avgScore = attempts.length > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0;

      // Group attempts by topic to find popular topics
      const quizzes = await this.prisma.quiz.findMany({
        select: { topic: true }
      });
      const topicCounts: Record<string, number> = {};
      quizzes.forEach(q => {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      });
      const popularTopics = Object.keys(topicCounts).map(topic => ({
        topic,
        count: topicCounts[topic]
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      return {
        totalUsers,
        totalQuizzes,
        totalAttempts,
        totalFlags,
        avgScore,
        popularTopics
      };
    } catch (error) {
      this.logger.error('Failed to fetch admin stats', error);
      throw new InternalServerErrorException('Failed to load admin statistics | एडमिन तथ्याङ्क तान्न असफल भयो');
    }
  }

  /**
   * Retrieves all users for admin management.
   * 
   * Admin को लागि सबै प्रयोगकर्ताको विवरण तान्छ।
   */
  async getAdminUsers() {
    this.logger.log('Fetching all users for admin');
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            quizzes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Updates a user's role.
   * 
   * प्रयोगकर्ताको भूमिका (role) परिवर्तन गर्छ।
   */
  async updateUserRole(userId: number, role: string) {
    this.logger.log(`Updating role of user ${userId} to ${role}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found | ID ${userId} भएको प्रयोगकर्ता भेटिएन`);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role }
    });
  }

  /**
   * Deletes a user.
   * 
   * प्रयोगकर्तालाई हटाउँछ।
   */
  async deleteUser(userId: number) {
    this.logger.log(`Deleting user ${userId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found | ID ${userId} भएको प्रयोगकर्ता भेटिएन`);
    }
    return this.prisma.user.delete({
      where: { id: userId }
    });
  }

  /**
   * Retrieves all active (unresolved) flags.
   * 
   * समाधान नभएका (unresolved) सबै फ्ल्याग रिपोर्टहरू तान्छ।
   */
  async getAdminFlags() {
    this.logger.log('Fetching all quiz flags for admin');
    return this.prisma.flag.findMany({
      where: { resolved: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          include: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Resolves/dismisses a flag.
   * 
   * फ्ल्याग रिपोर्टलाई समाधान भएको जनाउँछ।
   */
  async resolveFlag(flagId: number) {
    this.logger.log(`Resolving flag ${flagId}`);
    const flag = await this.prisma.flag.findUnique({ where: { id: flagId } });
    if (!flag) {
      throw new NotFoundException(`Flag with ID ${flagId} not found | ID ${flagId} भएको फ्ल्याग भेटिएन`);
    }
    return this.prisma.flag.update({
      where: { id: flagId },
      data: { resolved: true }
    });
  }

  /**
   * Deletes a quiz.
   * 
   * क्विजलाई हटाउँछ।
   */
  async deleteQuiz(quizId: number) {
    this.logger.log(`Deleting quiz ${quizId}`);
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found | ID ${quizId} भएको क्विज भेटिएन`);
    }
    return this.prisma.quiz.delete({
      where: { id: quizId }
    });
  }

  /**
   * Corrects a question using AI based on a flag report and resolves the flag.
   * 
   * फ्ल्याग रिपोर्टको आधारमा प्रश्न सच्याउँछ र रिपोर्टलाई समाधान भएको जनाउँछ।
   */
  async correctQuestion(quizId: number, questionId: number, flagId: number) {
    this.logger.log(`Admin correcting question ${questionId} in quiz ${quizId} for flag ${flagId}`);
    
    // 1. Fetch flag
    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId }
    });
    if (!flag) {
      throw new NotFoundException(`Flag report with ID ${flagId} not found | ID ${flagId} भएको फ्ल्याग रिपोर्ट भेटिएन`);
    }

    // 2. Fetch question
    const question = await this.prisma.question.findUnique({
      where: { id: questionId }
    });
    if (!question || question.quizId !== quizId) {
      throw new NotFoundException(`Question with ID ${questionId} not found in quiz ${quizId} | क्विजमा यो प्रश्न भेटिएन`);
    }

    // 3. Call AI Service to correct
    const originalContext = {
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || ''
    };
    const flagReasonText = `${flag.reason}${flag.comment ? ` - Comment: ${flag.comment}` : ''}`;
    
    const corrected = await this.aiService.correctQuestion(originalContext, flagReasonText);

    // 4. Update question details in DB
    const updatedQuestion = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: corrected.text,
        options: corrected.options,
        correctAnswer: corrected.correctAnswer,
        explanation: corrected.explanation
      }
    });

    // 5. Resolve the flag
    await this.prisma.flag.update({
      where: { id: flagId },
      data: { resolved: true }
    });

    return updatedQuestion;
  }
}

