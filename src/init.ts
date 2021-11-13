import { Db } from 'mongodb';
import { MongoInserter } from 'mongodb-extension';
import { ErrorHandler, Handler, RetryService, RetryWriter } from 'mq-one';
import { Client } from 'stompit';
import { Attributes, Validator } from 'validator-x';
import { ApplicationContext } from './context';
import { HealthController } from './controllers/HealthController';
import { User } from './models/User';
import { ActiveMQSubscriber, ActiveMQWriter, Config } from './services/activemq';
import { ActiveMQChecker } from './services/activemq';

const retries = [5000, 10000, 20000];

const user: Attributes = {
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

export function createContext(db: Db, client: Client, config: Config): ApplicationContext {
  const atmqChecker = new ActiveMQChecker(config);
  const health = new HealthController([atmqChecker]);
  const dbwriter = new MongoInserter(db.collection('users'), 'id');
  const retryWriter = new RetryWriter(dbwriter.write, retries, writeUser, log);
  const errorHandler = new ErrorHandler(log);
  const validator = new Validator<User>(user, true);
  const subscriber = new ActiveMQSubscriber<User>(client, config.destinationName, config.subscriptionName, 'client-individual', true, undefined, undefined, log, log);
  const writer = new ActiveMQWriter<User>(client, config.destinationName, config.subscriptionName);
  const retryService = new RetryService<User, boolean>(writer.write, log, log);
  const handler = new Handler<User, boolean>(retryWriter.write, validator.validate, retries, errorHandler.error, log, log, retryService.retry, 3, 'retry');
  const ctx: ApplicationContext = { handle: handler.handle, read: subscriber.subscribe, health };
  return ctx;
}

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}

export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
