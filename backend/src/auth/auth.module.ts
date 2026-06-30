import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule ties authentication features together.
 * It imports UsersModule to allow querying/creating user records.
 * 
 * AuthModule ले signup र login का Controllers र Services लाई register गर्छ।
 */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
