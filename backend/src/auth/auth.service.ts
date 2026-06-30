import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';

/**
 * AuthService handles business logic for authentication operations (signup, login, jwt).
 * 
 * AuthService ले signup र login सम्बन्धी business logic handle गर्छ।
 */
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

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
}
