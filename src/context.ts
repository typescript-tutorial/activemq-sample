import { HealthController } from 'health-service';
import { ErrorHandler, Handler, RetryService, RetryWriter, StringMap } from 'mq-one';
import { DB, PostgreSQLWriter } from 'pg-extension';
import { Client } from 'stompit';
import { Attributes, Validator } from 'xvalidators';
import { ActiveMQChecker, Config, createSender, Subscriber } from './services/activemq';

const retries = [5000, 10000, 20000];

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
}
export const user: Attributes = {
  id: {
    length: 40
  },
  username: {
    required: true,
    length: 255
  },
  email: {
    format: 'email',
    required: true,
    length: 120
  },
  phone: {
    format: 'phone',
    required: true,
    length: 14
  },
  dateOfBirth: {
    type: 'datetime'
  }
};

export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, header?: StringMap) => Promise<number>) => void;
  send: (data: User) => Promise<boolean>;
  health: HealthController;
}

export function createContext(db: DB, client: Client, config: Config): ApplicationContext {
  const atmqChecker = new ActiveMQChecker(config);
  const health = new HealthController([atmqChecker]);
  const writer = new PostgreSQLWriter<User>(db.exec, 'activemq', user);
  const retryWriter = new RetryWriter(writer.write, retries, writeUser, log);
  const errorHandler = new ErrorHandler(log);
  const validator = new Validator<User>(user, true);
  const subscriber = new Subscriber<User>(client, config.destinationName, config.subscriptionName, 'client-individual', true, log, log, undefined, undefined, undefined);
  const sender = createSender<User>(client, config.destinationName, config.subscriptionName);
  const retryService = new RetryService<User, boolean>(sender.send, log, log);
  const handler = new Handler<User, boolean>(retryWriter.write, validator.validate, retries, errorHandler.error, log, log, retryService.retry, 3, 'retry');
  const ctx: ApplicationContext = { handle: handler.handle, read: subscriber.subscribe, health, send: sender.send };
  return ctx;
}
export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
