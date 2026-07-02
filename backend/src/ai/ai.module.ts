import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

/**
 * AiModule manages the AI integration.
 * It registers the AiService and makes it available to other modules.
 * 
 * AiModule ले AI integration (Gemini / Mock) लाई handle गर्छ र AiService लाई export गर्छ।
 */
@Module({
  providers: [AiService],
  exports: [AiService], // Make AiService accessible to other modules
})
export class AiModule {}
