import { Injectable } from '@nestjs/common';

/** Service racine, sans logique métier : sert uniquement AppController. */

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
