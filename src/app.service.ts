import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'expense-tracker-pro-api',
      timestamp: new Date().toISOString(),
    };
  }
}
