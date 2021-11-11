import {Application} from 'express';
import {ApplicationContext} from './context';

export function route(app: Application, ctx: ApplicationContext): void {
    const health = ctx.healthController;
    app.get("/health", health.check);
}
