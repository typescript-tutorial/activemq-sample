import { json } from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { connectToDb } from 'mongodb-extension';
import { createContext } from './init';
import { route } from './route';
import { AmqConnection, Config } from './services/activemq';
// import { printData, retry } from './services/pubsub/retry';

dotenv.config();

const app = express();

const port = process.env.PORT;
const mongoURI = process.env.MONGO_URI;
const mongoDB = process.env.MONGO_DB;

const amqhost = process.env.AMQHOST;
const amqport = process.env.AMQPORT;
const amqUsername = process.env.AMQUSERNAME;
const amqPassword = process.env.AMQPASSWORD;
const amqDestinationName = process.env.AMQDESTINATIONNAME;
const amqSubscriptionName = process.env.AMQSUBSCRIPTIONNAME;

app.use(json());

connectToDb(`${mongoURI}`, `${mongoDB}`).then(async (db) => {
  if (!amqhost || !amqport || !amqUsername || !amqPassword || !amqDestinationName || !amqSubscriptionName) {
    throw new Error('config wrong!');
  }
  const config: Config = {
    host: amqhost,
    port: Number(amqport),
    username: amqUsername,
    password: amqPassword,
    destinationName: amqDestinationName,
    subscriptionName: amqDestinationName,
  };
  const amqConnection = new AmqConnection(config);
  const client = await amqConnection.connect();
  const ctx = createContext(db, client, config);
  ctx.read(ctx.handle);
  route(app, ctx);
  http.createServer(app).listen(port, () => {
    console.log('Start server at port ' + port);
  });
});
