import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * UsersModule exports UsersService so that it can be injected in AuthModule.
 * 
 * UsersModule ले UsersService लाई export गर्छ ताकी AuthModule मा use गर्न सकियोस्।
 */
@Module({
  providers: [UsersService],
  exports: [UsersService], // Exposing UsersService for injection in other modules
})
export class UsersModule {}
