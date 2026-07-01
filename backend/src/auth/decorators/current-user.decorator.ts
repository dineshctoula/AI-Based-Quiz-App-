import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser decorator extracts the validated user object from the HTTP request.
 * Requires the route to be protected by JwtAuthGuard.
 * 
 * @CurrentUser ले request object बाट logged-in user को data सिधै तान्छ।
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // passport has attached the user to the request as request.user
    // passport ले request.user मा user details set गरेको हुन्छ
    return request.user;
  },
);
