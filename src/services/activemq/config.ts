import { ConnectFailoverOptions } from 'stompit/lib/ConnectFailover';

export interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
  destinationName: string;
  subscriptionName: string;
  heartBeat?: string;
  reconnectOptions?: ConnectFailoverOptions;
}
