import { json } from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { getBody } from 'logger-core';
import { connectToDb } from 'mongodb-extension';
import { createContext } from './context';
import { ActiveMQConnection, Config } from './services/activemq';

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
  if (
    !amqhost ||
    !amqport ||
    !amqUsername ||
    !amqPassword ||
    !amqDestinationName ||
    !amqSubscriptionName
  ) {
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
  const amqConnection = new ActiveMQConnection(config);
  const client = await amqConnection.connect();
  const ctx = createContext(db, client, config);
  ctx.read(ctx.handle);

  http.createServer((req, res) => {
      if (req.url === '/health') {
        ctx.health.check(req, res);
      } else if (req.url === '/send') {
        getBody(req).then((body: any) => {
          ctx
            .write(JSON.parse(body))
            .then(() => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'message was produced' }));
            })
            .catch((err) => {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err }));
            });
        }).catch(err => console.log(err));
      }
    })
    .listen(port, () => {
      console.log('Start server at port ' + port);
    });
});
