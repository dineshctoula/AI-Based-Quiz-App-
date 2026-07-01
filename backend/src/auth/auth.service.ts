import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * AuthService handles business logic for authentication operations (signup, login, jwt).
 * 
 * AuthService ले signup र login सम्बन्धी business logic handle गर्छ।
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user, hashes their password, and saves them to the database
   * @param signUpDto The registration payload
   * @returns User object without the hashed password
   */
  async register(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;

    // 1. Check if the user email is already registered
    // इमेल पहिले नै register छ कि छैन चेक गर्ने
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(
        'यो इमेल पहिले नै प्रयोग भइसकेको छ (Email already in use)',
      );
    }

    // 2. Hash the password using bcrypt with 10 salt rounds
    // पासवर्डलाई सुरक्षित तरिकाले encrypt (hash) गर्ने
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save the new user record to the database
    // database मा user save गर्ने
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });

    // 4. Return the user, excluding the password field for security
    // सुरक्षाको लागि पासवर्ड बाहेकको user object return गर्ने
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Validates a user's credentials (email and password).
   * @param loginDto The credentials containing email and password
   * @returns The user object (without password) if valid
   */
  async validateUser(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    // database मा email अनुसार user खोज्ने
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('अवैध इमेल वा पासवर्ड (Invalid email or password)');
    }

    // Compare raw password with hashed password stored in DB
    // raw password र hashed password मिल्छ कि मिल्दैन चेक गर्ने
    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('अवैध इमेल वा पासवर्ड (Invalid email or password)');
    }

    // Return user without password
    // password बाहेक user details return गर्ने
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Generates a signed JWT access token for a validated user.
   * @param user The validated user object
   * @returns Access token and user info
   */
  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    
    // Sign the JWT token with payload
    // user detail बाट token generate गर्ने
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
