import { merge } from 'config-plus';
import dotenv from 'dotenv';
import http from 'http';
import { getBody } from 'logger-core';
import { Pool } from 'pg';
import { PoolManager } from 'pg-extension';
import { config, env } from './config';
import { createContext } from './context';
import { ActiveMQConnection } from './services/activemq';

dotenv.config();
const conf = merge(config, process.env, env, process.env.ENV);

const pool = new Pool(conf.db);
const db = new PoolManager(pool);
const amqConnection = new ActiveMQConnection(conf.amq);
amqConnection.connect().then(client => {
  const ctx = createContext(db, client, conf.amq);
  ctx.read(ctx.handle);

  http.createServer((req, res) => {
    if (req.url === '/health') {
      ctx.health.check(req, res);
    } else if (req.url === '/send') {
      getBody(req).then((body: any) => {
        ctx
          .send(JSON.parse(body))
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
