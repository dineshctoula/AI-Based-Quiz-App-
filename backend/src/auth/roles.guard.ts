import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // Process the request and authorize roles
  // Request लाई जाँचेर भूमिका (role) मिलेको खण्डमा प्रवेश दिने
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    // यदि कुनै भूमिका तोकिएको छैन भने सिधै अनुमति दिने
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // If no user is authenticated, deny access
    // यदि प्रयोगकर्ता login छैन भने रोक्ने
    if (!user) {
      return false;
    }

    // Check if user's role matches any of the required roles
    // प्रयोगकर्ताको भूमिका आवश्यक भूमिकामध्ये एक हो कि होइन भनी जाँच्ने
    return requiredRoles.includes(user.role);
  }
}
