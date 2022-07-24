export interface StringMap {
  [key: string]: string;
}
export function toString(v: any, attributes?: StringMap): string {
  if (attributes) {
    const ks = Object.keys(attributes);
    if (ks.length > 0) {
      if (typeof v === 'string') {
        return v + JSON.stringify(attributes);
      } else {
        return JSON.stringify(v) + ' ' + JSON.stringify(attributes);
      }
    } else {
      return ts(v);
    }
  } else {
    return ts(v);
  }
}
export function ts(v: any): string {
  if (typeof v === 'string') {
    return v;
  } else {
    return JSON.stringify(v);
  }
}
