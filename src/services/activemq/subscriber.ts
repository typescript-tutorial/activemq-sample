import Client from 'stompit/lib/Client';
import { StringMap, toString } from './core';
import { Message } from './message';

export type AckMode = 'auto' | 'client' | 'client-individual'; // Client does not send ACK, Client sends ACK/NACK, Client sends ACK/NACK for individual messages
export type Hanlde<T> = (data: T, attributes?: StringMap, raw?: Client.Message) => Promise<number>;

export function createSubscriber<T>(
  client: Client,
  destinationName: string,
  subscriptionName: string,
  ackMode: AckMode,
  ackOnConsume: boolean,
  logError?: (msg: any) => void,
  logInfo?: (msg: any) => void,
  prefix?: string,
  retryCountName?: string,
  encoding?: string,
) {
  return new Subscriber<T>(client, destinationName, subscriptionName, ackMode, ackOnConsume, logError, logInfo, prefix, retryCountName, encoding);
}
export const createConsumer = createSubscriber;
export const createReader = createSubscriber;
export const createReceiver = createSubscriber;
export class Subscriber<T> {
  private destinationName: string;
  private subscriptionName: string;
  retryCountName: string;
  encoding: string;
  constructor(
    private client: Client,
    destinationName: string,
    subscriptionName: string,
    private ackMode: AckMode,
    private ackOnConsume: boolean,
    public logError?: (msg: any) => void,
    public logInfo?: (msg: any) => void,
    private prefix?: string,
    retryCountName?: string,
    encoding?: string,
  ) {
    this.encoding = (encoding && encoding.length > 0 ? encoding : 'utf-8');
    this.destinationName = destinationName;
    this.subscriptionName = subscriptionName;
    if (!retryCountName || retryCountName.length === 0) {
      this.retryCountName = 'retryCount';
    } else {
      this.retryCountName = retryCountName;
    }
    this.subscribe = this.subscribe.bind(this);
    this.get = this.get.bind(this);
    this.receive = this.receive.bind(this);
    this.read = this.read.bind(this);
    this.consume = this.consume.bind(this);
  }
  get(handle: Hanlde<T>) {
    return this.subscribe(handle);
  }
  receive(handle: Hanlde<T>) {
    return this.subscribe(handle);
  }
  read(handle: Hanlde<T>) {
    return this.subscribe(handle);
  }
  consume(handle: Hanlde<T>) {
    return this.subscribe(handle);
  }
  subscribe(handle: Hanlde<T>): void {
    const prefix = this.prefix && this.prefix.length > 0 ? this.prefix : '/';
    const subscribeHeaders = {
      'destination': `${this.destinationName}${prefix}${this.subscriptionName}`,
      'ack': this.ackMode,
      'subscription-type': 'ANYCAST'
    };
    this.client.subscribe(subscribeHeaders, (error, message) => {
      if (error && this.logError) {
        this.logError('subscribe error ' + error.message);
        return;
      }
      if (this.logInfo) {
        this.logInfo('received : ' + message);
      }
      message.readString(this.encoding, (errorRead, body) => {
        if (errorRead && this.logError) {
          this.logError('read message error ' + errorRead.message);
          return;
        }
        if (this.logInfo) {
          this.logInfo('received message: ' + body);
        }
        const messageContent: Message<T, Client.Message> = {};
        try {
          if (body) {
            if (JSON.parse(body)[this.retryCountName]) {
              messageContent.data = JSON.parse(body).data;
              messageContent.attributes = JSON.parse(body)[this.retryCountName];
            } else {
              const a: StringMap = {};
              a[this.retryCountName] = '0';
              messageContent.data = JSON.parse(body);
              messageContent.attributes = a;
            }
            if (!messageContent.data) {
              throw new Error('message is empty!');
            }
            handle(messageContent.data, messageContent.attributes, message);
          }
        } catch (e) {
          if (this.logError) {
            this.logError('Fail to consume message: ' + toString(e));
          }
        }
        if (this.ackOnConsume && this.ackMode !== 'auto') {
          this.client.ack(message);
        }
      });
    });
  }
}
