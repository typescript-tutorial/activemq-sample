import { StringMap, toString } from 'mq-one';
import Client = require('stompit/lib/Client');
import { Message } from './message';

export type AckMode = 'auto' | 'client' | 'client-individual'; // Client does not send ACK, Client sends ACK/NACK, Client sends ACK/NACK for individual messages

export class ActiveMQSubscriber<T> {
  private destinationName: string;
  private subscriptionName: string;
  retryCountName: string;
  constructor(
    private client: Client,
    destinationName: string,
    subscriptionName: string,
    private ackMode: AckMode,
    private ackOnConsume: boolean,
    private prefix?: string,
    retryCountName?: string,
    public logError?: (msg: any) => void,
    public logInfo?: (msg: any) => void,
  ) {
    this.destinationName = destinationName;
    this.subscriptionName = subscriptionName;
    if (!retryCountName || retryCountName.length === 0) {
      this.retryCountName = 'retryCount';
    } else {
      this.retryCountName = retryCountName;
    }
    this.subscribe = this.subscribe.bind(this);
  }

  subscribe(handle: (data: T, attributes?: StringMap) => Promise<number>): void {
    const prefix = this.prefix && this.prefix.length > 0 ? this.prefix : '/';
    const subscribeHeaders = {
      'destination': `${this.destinationName}${prefix}${this.subscriptionName}`,
      'ack': this.ackMode,
      'subscription-type': 'ANYCAST'
    };
    this.client.subscribe(subscribeHeaders, (error, message) => {
      if (error && this.logError) {
        this.logError('Subscribe error ' + error.message);
        return;
      }
      if (this.logInfo) {
        this.logInfo('received : ' + message);
      }
      message.readString('utf-8', (errorRead, body) => {
        if (errorRead && this.logInfo) {
          this.logInfo('read message error ' + errorRead.message);
          return;
        }
        if (this.logInfo) {
          this.logInfo('received message: ' + body);
        }
        const messageContent: Message<T> = {};
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
              throw new Error('message content is empty!');
            }
            handle(messageContent.data, messageContent.attributes);
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
