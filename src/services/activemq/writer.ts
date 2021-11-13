import { StringMap } from 'mq-one';
import Client = require('stompit/lib/Client');
import { Message } from './message';

export class ActiveMQWriter<T> {
  constructor(
    private client: Client,
    private destinationName: string,
    private subscriptionName: string,
    private contentType?: string,
    private prefix?: string,
    private log?: (msg: any) => void
  ) {
    this.write = this.write.bind(this);
  }

  write(data: T, attributes?: StringMap): Promise<boolean> {
    const prefix = this.prefix && this.prefix.length > 0 ? this.prefix : '/';
    const sendHeaders = {
      'destination': `${this.destinationName}${prefix}${this.subscriptionName}`,
      'content-type': this.contentType && this.contentType.length > 0 ? this.contentType : 'text/plain',
    };
    const message: Message<T> = {
      data,
      attributes
    };
    return new Promise((resolve, reject) => {
      const frame = this.client.send(sendHeaders);
      if (this.log) {
        this.log('produce send data : ' + JSON.stringify(message));
      }
      const result = frame.write(JSON.stringify(message));
      frame.end((err: any) => {
        if (err) {
          console.log('Error activemq: ', err);
          reject(err);
        }
      });
      resolve(result);
    });
  }
}
