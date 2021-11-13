import { StringMap } from 'mq-one';
import { HealthController } from './controllers/HealthController';
import { User } from './models/User';

export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, attributes?: StringMap | undefined) => Promise<number>) => void;
  health: HealthController;
}
