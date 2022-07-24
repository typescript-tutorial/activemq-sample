import { StringMap } from './core';

export interface Message<T, R> {
  data?: T;
  id?: string;
  attributes?: StringMap;
  raw?: R;
}
