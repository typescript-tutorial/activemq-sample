import { Application } from 'express';
import { ApplicationContext } from './context';

export function route(app: Application, ctx: ApplicationContext): void {
  const health = ctx.health;
  app.get('/health', health.check);
}
