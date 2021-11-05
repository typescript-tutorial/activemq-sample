import * as stompit from 'stompit';
import * as Client from 'stompit/lib/Client';
import {ConnectFailoverOptions} from 'stompit/lib/ConnectFailover';

export class AmqConnection {
  constructor() {
    this.connect = this.connect.bind(this);
  }

  connect(host: string, port: number, userName: string, password: string, heartBeat?: string, reconnectOptions?: ConnectFailoverOptions): Promise<Client> {
    const connectOptions = {
      'host': host,
      'port': port,
      'connectHeaders': {
        'host': '/',
        'login': userName,
        'passcode': password,
        'heart-beat': heartBeat ? heartBeat : '5000,0'
      }
    };
    const reconnectOptionsDefault = {
      initialReconnectDelay: 10,
      maxReconnectDelay: 60000, // 1 minute
      reconnectDelayExponent: 2
    };
    const reconnectOptionsMerged = {...reconnectOptionsDefault, ...reconnectOptions};
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
