import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

/**
 * JwtStrategy extracts the JWT token from the Authorization header (Bearer token)
 * and validates it against the JWT_SECRET.
 * 
 * JwtStrategy ले HTTP request को header बाट JWT token झिकेर validate गर्छ।
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      // Extract JWT from the Authorization header as a Bearer token
      // Request header को Authorization: Bearer <token> बाट token निकाल्ने
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Do not ignore expiration - let passport handle expired tokens
      // expired भएको token लाई reject गर्ने
      ignoreExpiration: false,
      
      // Secret key to verify the token signature
      // token verification को लागि secret key
      secretOrKey: process.env.JWT_SECRET || 'dev_local_secret_jwt_signkey_for_quiz_app',
    });
  }

  /**
   * Called automatically after passport successfully decodes and verifies the signature of the JWT.
   * @param payload The decoded JWT claims (e.g. { sub: userId, email: email })
   * @returns The user record from the database (injected into request.user)
   */
  async validate(payload: { sub: number; email: string }) {
    // Check if the user exists in our database
    // token भित्र भएको user ID (sub) बाट database मा user खोज्ने
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('प्रयोगकर्ता फेला परेन वा अवैध टोकन (User not found or invalid token)');
    }

    // Exclude the password field for security
    // security को लागि password हटाएर user data मात्र return गर्ने
    const { password, ...result } = user;
    return result;
  }
}
