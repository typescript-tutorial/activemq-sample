export const config = {
  port: 8088,
  log: {
    level: 'debug',
    map: {
      time: '@timestamp',
      msg: 'message',
    },
    db: true,
  },
  db: {
    user: 'dqcpsquyjmmxkb',
    host: 'ec2-54-228-125-183.eu-west-1.compute.amazonaws.com',
    password: '1093639f514498fbf09e803d98714b853849704783dc052aa1ef2039c60fe6e0',
    database: 'd8maa489i4calm',
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    }
  },
  amq: {
    host: 'localhost',
    port: 61613,
    username: 'admin',
    password: 'admin',
    destinationName: 'topic',
    subscriptionName: 'sub-user',
  }
};

export const env = {
  sit: {
    mongo: {
      db: 'masterdata',
    },
  },
  prd: {
    log: {
      level: 'error',
    },
    middleware: {
      log: false,
    },
  },
};
