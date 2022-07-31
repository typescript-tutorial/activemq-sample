import { json } from 'body-parser';
import { merge } from 'config-plus';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { getBody } from 'logger-core';
import { connectToDb } from 'mongodb-extension';
import { config, env } from './config';
import { createContext } from './context';
import { ActiveMQConnection } from './services/activemq';

dotenv.config();

const app = express();
const conf = merge(config, process.env, env, process.env.ENV);

app.use(json());

connectToDb(
  `${conf.db.uri}`,
  `${conf.db.db}`
).then(async (db) => {
  const amqConnection = new ActiveMQConnection(conf.amq);
  const client = await amqConnection.connect();
  const ctx = createContext(db, client, conf.amq);
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
  }).listen(conf.port, () => {
    console.log('Start server at port ' + conf.port);
  });
});
