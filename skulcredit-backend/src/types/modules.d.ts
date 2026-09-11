declare module 'firebase-admin' {
  const admin: any;
  export = admin;
}

declare module 'ioredis' {
  const Redis: any;
  export = Redis;
}

declare module 'socket.io' {
  export const Server: any;
  export type Socket = any;
}
