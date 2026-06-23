import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// यो controller हो जसले API routes handle गर्छ
@Controller()
export class AppController {

  // AppService inject गरिएको (business logic यहाँबाट आउँछ)
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
