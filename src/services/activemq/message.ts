import { StringMap } from 'mq-one';

export interface Message<T> {
  data?: T;
  id?: string;
  attributes?: StringMap;
  raw?: any;
}
