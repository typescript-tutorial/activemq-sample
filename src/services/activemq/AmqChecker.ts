import { checkConnect } from "./AmqConnection";
import { Config } from "./config";


export interface AnyMap {
    [key: string]: any;
}
export interface HealthChecker {
    name(): string;
    build(data: AnyMap, error: any): AnyMap;
    check(): Promise<AnyMap>;
}

export interface CheckResult {
    status: string,
    details: any,
}

export class ActivemqChecker {
    constructor(public config: Config, public service?: string, private timeout?: number) {
        this.check = this.check.bind(this);
        this.name = this.name.bind(this);
        this.build = this.build.bind(this);
    }
    check(): Promise<AnyMap> {
        const obj = {} as AnyMap;
        const promise = new Promise<any>(async(resolve, reject) => {
            try{
                await checkConnect(this.config);
                resolve(obj);
            }catch (err) {
                reject(`Database down!`);
            }
        });
        if (!this.timeout) {
            this.timeout = 4200;
        }
        if (this.timeout > 0) {
            return promiseTimeOut(this.timeout, promise);
        } else {
            return promise;
        }
    }
    name(): string {
        if (!this.service) {
            this.service = "activemq";
        }
        return this.service;
    }
    build(data: AnyMap, err: any): AnyMap {
        if (err) {
          if (!data) {
            data = {} as AnyMap;
          }
          data['error'] = err;
        }
        return data;
    }
}

function promiseTimeOut(timeoutInMilliseconds: number, promise: Promise<any>): Promise<any> {
    return Promise.race([
      promise,
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(`Timed out in: ${timeoutInMilliseconds} milliseconds!`);
        }, timeoutInMilliseconds);
      })
    ]);
  }
  