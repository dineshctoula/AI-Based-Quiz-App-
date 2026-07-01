import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard is a custom guard that extends the passport-jwt strategy.
 * Apply it using @UseGuards(JwtAuthGuard) to protect controllers or endpoints.
 * 
 * JwtAuthGuard ले routes हरूलाई protect गर्छ (JWT नभए Request reject गर्छ)।
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
