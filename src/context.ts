import { HealthController } from 'controllers/HealthController';
import { User } from 'models/User';
import { StringMap } from 'mq-one';

export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, attributes?: StringMap | undefined) => Promise<number>) => void,
  healthController:HealthController;
}
