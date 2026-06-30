import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';

/**
 * AuthController defines HTTP routes for authentication actions.
 * Prefixed with 'auth', yielding endpoints like /auth/signup.
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
}
