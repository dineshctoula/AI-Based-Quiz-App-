import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule exposes the database connection service globally.
 * By making it @Global(), we do not need to re-import PrismaModule in every feature module.
 * 
 * @Global() decorator ले गर्दा यस PrismaService लाई अन्य module मा direct inject गर्न सकिन्छ।
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exposing PrismaService so other modules can use it
})
export class PrismaModule {}
