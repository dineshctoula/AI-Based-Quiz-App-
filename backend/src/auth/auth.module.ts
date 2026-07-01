import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

/**
 * AuthModule ties authentication features together.
 * Configures JwtModule with secret key and token expiration.
 * Exports PassportModule and JwtModule to be used elsewhere if needed.
 * 
 * AuthModule ले Passport र JWT system लाई configure गरेर export गर्छ।
 */
@Module({
  imports: [
    UsersModule,
    // Enable Passport authentication strategies
    // passport module configure गर्ने
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Register JwtModule and configure signature options
    // JWT signature र token validation settings register गर्ने
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_local_secret_jwt_signkey_for_quiz_app',
      signOptions: { expiresIn: '1d' }, // Token valid for 1 day
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
