import { merge } from 'config-plus';
import { json } from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { getBody } from 'logger-core';
import { connectToDb } from 'mongodb-extension';
import { createContext } from './context';
import { ActiveMQConnection, Config } from './services/activemq';
import { config, env } from './config';

dotenv.config();

const app = express();
const conf = merge(config, process.env, env, process.env.ENV);

const port = conf.port;


app.use(json());

connectToDb(
  `${conf.db.uri}`,
  `${conf.db.db}`
).then(async (db) => {
  if (
    !conf.amq.host ||
    !conf.amq.port ||
    !conf.amq.username ||
    !conf.amq.password ||
    !conf.amq.destinationName ||
    !conf.amq.subscriptionName
  ) {
    throw new Error('config wrong!');
  }
  const config: Config = {
    host: conf.amq.host,
    port: conf.amq.port,
    username: conf.amq.username,
    password: conf.amq.password,
    destinationName: conf.amq.destinationName,
    subscriptionName: conf.amq.subscriptionName,
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
        }).catch((err: any) => console.log(err));
      }
    })
    .listen(port, () => {
      console.log('Start server at port ' + port);
    });
});
