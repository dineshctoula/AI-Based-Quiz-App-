import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AskTutorDto } from './dto/ask-tutor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * QuizzesController handles incoming HTTP requests related to quizzes.
 * Exposes endpoints to retrieve quizzes, submit attempts, and fetch attempt history under JWT protection.
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
   */
  @Post('generate')
  async generateQuiz(
    @CurrentUser() user: { id: number; email: string },
    @Body() dto: GenerateQuizDto,
  ) {
    return this.quizzesService.generateQuiz(user.id, dto);
  }

  /**
   * Endpoint to retrieve all quizzes.
   * GET /api/quizzes
   * 
   * सबै quiz हरू तान्ने endpoint.
   */
  @Get()
  async findAll() {
    return this.quizzesService.findAll();
  }

  /**
   * Endpoint to retrieve the global leaderboard.
   * GET /api/quizzes/leaderboard
   * 
   * Global leaderboard र्‍याङ्किङ तान्ने endpoint.
   */
  @Get('leaderboard')
  async getLeaderboard() {
    return this.quizzesService.getLeaderboard();
  }

  /**
   * Endpoint to retrieve the logged-in user's performance statistics.
   * GET /api/quizzes/stats/performance
   * 
   * Login भएको user को बिषयगत बलियो पक्ष र score trends analytics तान्ने endpoint.
   */
  @Get('stats/performance')
  async getPerformanceStats(@CurrentUser() user: { id: number; email: string }) {
    return this.quizzesService.getPerformanceStats(user.id);
  }

  /**
   * Endpoint to retrieve the logged-in user's quiz attempt history.
   * GET /api/quizzes/attempts/my
   * 
   * login भएको user को quiz attempt history तान्ने endpoint.
   * Note: This route must be declared BEFORE the /:id route to avoid wildcard matching issues.
   */
  @Get('attempts/my')
  async findMyAttempts(@CurrentUser() user: { id: number; email: string }) {
    return this.quizzesService.findUserAttempts(user.id);
  }

  /**
   * Endpoint to retrieve system-wide stats for admin.
   * GET /api/quizzes/admin/stats
   * 
   * एडमिनको लागि सम्पूर्ण प्रणालीको तथ्याङ्क तान्ने endpoint.
   */
  @Get('admin/stats')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAdminStats() {
    return this.quizzesService.getAdminStats();
  }

  /**
   * Endpoint to retrieve all users for admin management.
   * GET /api/quizzes/admin/users
   * 
   * एडमिनको लागि सबै प्रयोगकर्ताको विवरण तान्ने endpoint.
   */
  @Get('admin/users')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAdminUsers() {
    return this.quizzesService.getAdminUsers();
  }

  /**
   * Endpoint to update a user's role.
   * PATCH /api/quizzes/admin/users/:id/role
   * 
   * प्रयोगकर्ताको भूमिका परिवर्तन गर्ने endpoint.
   */
  @Patch('admin/users/:id/role')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
  ) {
    return this.quizzesService.updateUserRole(id, role);
  }

  /**
   * Endpoint to delete a user.
   * DELETE /api/quizzes/admin/users/:id
   * 
   * प्रयोगकर्ता हटाउने endpoint.
   */
  @Delete('admin/users/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.deleteUser(id);
  }

  /**
   * Endpoint to retrieve all reports/flags for admin.
   * GET /api/quizzes/admin/flags
   * 
   * एडमिनको लागि फ्ल्याग रिपोर्टहरू तान्ने endpoint.
   */
  @Get('admin/flags')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAdminFlags() {
    return this.quizzesService.getAdminFlags();
  }

  /**
   * Endpoint to resolve a flag.
   * PATCH /api/quizzes/admin/flags/:id/resolve
   * 
   * फ्ल्याग रिपोर्ट समाधान भएको जनाउने endpoint.
   */
  @Patch('admin/flags/:id/resolve')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async resolveFlag(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.resolveFlag(id);
  }

  /**
   * Endpoint to delete a quiz.
   * DELETE /api/quizzes/admin/quizzes/:id
   * 
   * क्विज हटाउने endpoint.
   */
  @Delete('admin/quizzes/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async deleteQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.deleteQuiz(id);
  }

  /**
   * Endpoint to correct a flagged question using AI.
   * POST /api/quizzes/admin/quizzes/:quizId/correct-question/:questionId
   * 
   * फ्ल्याग गरिएको प्रश्नलाई AI द्वारा संशोधन गर्ने endpoint.
   */
  @Post('admin/quizzes/:quizId/correct-question/:questionId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async correctQuestion(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body('flagId', ParseIntPipe) flagId: number,
  ) {
    return this.quizzesService.correctQuestion(quizId, questionId, flagId);
  }


  /**
   * Endpoint to retrieve a specific quiz details (sanitized questions).
   * GET /api/quizzes/:id
   * 
   * एउटा specific quiz को details तान्ने endpoint (correct answers र explanations हटाएर)।
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOne(id);
  }

  /**
   * Endpoint to submit a quiz attempt and get graded feedback.
   * POST /api/quizzes/:id/attempt
   * 
   * user ले quiz submit गर्दा answers जाँचेर score calculate गर्ने र save गर्ने endpoint.
   */
  @Post(':id/attempt')
  async submitAttempt(
    @CurrentUser() user: { id: number; email: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(user.id, id, dto);
  }

  /**
   * Endpoint to ask the AI Tutor follow-up questions about a specific quiz question.
   * POST /api/quizzes/:id/tutor
   * 
   * AI Tutor लाई सोधिएको थप प्रश्नको जवाफ दिने endpoint.
   */
  @Post(':id/tutor')
  async askTutor(
    @CurrentUser() user: { id: number; email: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AskTutorDto,
  ) {
    return this.quizzesService.askTutor(user.id, id, dto);
  }

  /**
   * Endpoint to report/flag a quiz.
   * POST /api/quizzes/:id/flag
   * 
   * प्रयोगकर्ताले क्विजमा फ्ल्याग/रिपोर्ट दर्ता गर्ने endpoint.
   */
  @Post(':id/flag')
  async flagQuiz(
    @CurrentUser() user: { id: number; email: string },
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @Body('comment') comment?: string,
  ) {
    return this.quizzesService.flagQuiz(user.id, id, reason, comment);
  }
}
