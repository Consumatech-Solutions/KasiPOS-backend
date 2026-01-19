import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): {
    name: string;
    version: string;
    description: string;
    documentation: string;
  } {
    //return api info
    return {
      name: 'KasiPOS API',
      version: '1.0.0',
      description: 'Backend API for KasiPOS - Point of Sale System',
      documentation: 'http://localhost:3000/api',
    };
  }
}
