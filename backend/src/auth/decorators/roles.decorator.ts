import { SetMetadata } from '@nestjs/common';

// Metadata key for storing roles
// Roles metadata को लागि key
export const ROLES_KEY = 'roles';

// Decorator to secure routes with roles
// Routes हरूमा role metadata set गर्ने decorator
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
