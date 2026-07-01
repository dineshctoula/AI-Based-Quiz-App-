import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * AuthController defines HTTP routes for authentication actions.
 * Prefixed with 'auth', yielding endpoints like /auth/signup and /auth/login.
 * 
 * AuthController ले signup र login का HTTP routes हरू manage गर्छ।
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint for user registration: POST /auth/signup
   * @param signUpDto Validated payload from request body
   * @returns User object (without password)
   */
  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.register(signUpDto);
  }

  /**
   * Endpoint for user login: POST /auth/login
   * @param loginDto Validated credentials payload
   * @returns JWT access token and user info
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Validate email and password first
    // email र password validate गर्ने
    const validatedUser = await this.authService.validateUser(loginDto);
    
    // Perform login and return access token
    // login गराएर token र user details पठाउने
    return this.authService.login(validatedUser);
  }

  /**
   * Endpoint to retrieve currently authenticated user profile: GET /auth/me
   * Protected by JwtAuthGuard.
   * @param user Injected current user info
   * @returns Current user object
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    // Current user context retrieved from request
    // current logged-in user को details return गर्ने
    return user;
  }
}
