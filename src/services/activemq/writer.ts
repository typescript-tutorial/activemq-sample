import Client from 'stompit/lib/Client';
import { StringMap, toString } from './core';
import { Message } from './message';

export type Log = (msg: any) => void;
export function createWriter<T>(
  client: Client,
  destinationName: string,
  subscriptionName: string,
  logError?: Log,
  logInfo?: Log,
  contentType?: string,
  prefix?: string,
) {
  return new Writer<T>(client, destinationName, subscriptionName, logError, logInfo, contentType, prefix);
}
export const createProducer = createWriter;
export const createSender = createWriter;
export const createPublisher = createWriter;
export class Writer<T> {
  constructor(
    private client: Client,
    private destinationName: string,
    private subscriptionName: string,
    private logError?: Log,
    private logInfo?: Log,
    private contentType?: string,
    private prefix?: string,
  ) {
    this.write = this.write.bind(this);
    this.send = this.send.bind(this);
    this.publish = this.publish.bind(this);
    this.put = this.put.bind(this);
    this.produce = this.produce.bind(this);
  }
  put(data: T, attributes?: StringMap): Promise<boolean> {
    return this.write(data, attributes);
  }
  send(data: T, attributes?: StringMap): Promise<boolean> {
    return this.write(data, attributes);
  }
  produce(data: T, attributes?: StringMap): Promise<boolean> {
    return this.write(data, attributes);
  }
  publish(data: T, attributes?: StringMap): Promise<boolean> {
    return this.write(data, attributes);
  }
  write(data: T, attributes?: StringMap): Promise<boolean> {
    const prefix = this.prefix && this.prefix.length > 0 ? this.prefix : '/';
    const sendHeaders = {
      'destination': `${this.destinationName}${prefix}${this.subscriptionName}`,
      'content-type': this.contentType && this.contentType.length > 0 ? this.contentType : 'text/plain',
    };
    const message: Message<T, Client.Message> = {
      data,
      attributes
    };
    return new Promise((resolve, reject) => {
      const frame = this.client.send(sendHeaders);
      if (this.logInfo) {
        this.logInfo('produce message: ' + JSON.stringify(message.data));
      }
      const result = frame.write(JSON.stringify(message.data));
      frame.end((err: any) => {
        if (err) {
          if (this.logError) {
            this.logError('ActiveMQ error when sending message: ' + toString(err));
          }
          reject(err);
        }
      });
      resolve(result);
    });
  }
}
