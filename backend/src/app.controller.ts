import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// यो controller हो जसले API routes handle गर्छ
@Controller()
export class AppController {

  // AppService inject गरिएको (business logic यहाँबाट आउँछ)
  constructor(private readonly appService: AppService) { }

  // GET /api (default route)
  @Get()
  getHello(): string {
    // service बाट data फर्काउने
    return this.appService.getHello();
  }

  // GET /api/health (server health check endpoint)
  @Get('health')
  getHealth() {
    return {
      status: 'ok', // server चलिरहेको छ भन्ने संकेत
      timestamp: new Date().toISOString(), // अहिलेको समय
      uptime: process.uptime(), // server कति समयदेखि चलिरहेको छ
    };
  }
}
