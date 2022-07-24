import * as stompit from 'stompit';
import Client from 'stompit/lib/Client';
import { Config } from './config';

export class ActiveMQConnection {
  constructor(private config: Config) {
    this.connect = this.connect.bind(this);
  }
  connect(): Promise<Client> {
    const connectOptions = {
      'host': this.config.host,
      'port': this.config.port,
      'connectHeaders': {
        'host': '/',
        'login': this.config.username,
        'passcode': this.config.password,
        'heart-beat': this.config.heartBeat ? this.config.heartBeat : '5000,0'
      }
    };
    const reconnectOptionsDefault = {
      initialReconnectDelay: 10,
      maxReconnectDelay: 60000, // 1 minute
      reconnectDelayExponent: 2
    };
    const reconnectOptionsMerged = { ...reconnectOptionsDefault, ...reconnectOptionsDefault };
    return new Promise<Client>((resolve, reject) => {
      const clientConnect = new stompit.ConnectFailover([connectOptions], reconnectOptionsMerged);
      clientConnect.on('connect', () => {
        console.log('[AMQ] Client connected to ' + connectOptions.host);
      });
      clientConnect.on('error', (err) => {
        console.log('[AMQ] Error connect init ' + err + new Date().toISOString());
      });

      clientConnect.connect((error, client, reconnect) => {
        if (error) {
          console.log('[Error] AMQ cannot connect ', error);
          reject(error);
        }
        client.on('error', (err) => {
          reconnect();
        });
        resolve(client);
      });
    });
  }
}

export function check(config: Config): Promise<void> {
  const connectOptions = {
    'host': config.host,
    'port': config.port,
    'connectHeaders': {
      'host': '/',
      'login': config.username,
      'passcode': config.password,
      'heart-beat': config.heartBeat ? config.heartBeat : '5000,0'
    }
  };
  const reconnectOptionsDefault = {
    initialReconnectDelay: 10,
    maxReconnectDelay: 60000, // 1 minute
    reconnectDelayExponent: 2
  };
  const reconnectOptionsMerged = { ...reconnectOptionsDefault, ...reconnectOptionsDefault };
  return new Promise((resolve, reject) => {
    const clientConnect = new stompit.ConnectFailover([connectOptions], reconnectOptionsMerged);
    clientConnect.connect((error, client) => {
      if (error) {
        reject(error);
      }
      client.on('error', (err) => {
        reject(error);
      });
      resolve();
    });
  });
}
