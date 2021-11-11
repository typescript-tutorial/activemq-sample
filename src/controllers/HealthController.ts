import {Request, Response} from 'express';
import { check } from '../services/activemq/health';
import { HealthChecker } from '../services/activemq/AmqChecker';

export class HealthController {
  constructor(protected checkers: HealthChecker[]) {
    this.check = this.check.bind(this);
  }
  async check(req: Request, res: Response) {
    check(this.checkers).then(heath => {
      if (heath.status === 'UP') {
        return res.status(200).json(heath).end();
      } else {
        return res.status(500).json(heath).end();
      }
    });
  }
}
