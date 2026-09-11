import Redis from 'ioredis';
import env from './env';
import logger from './logger';

const redis = new Redis(env.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 5) {
      logger.error('Redis: max reconnect attempts reached — check that Redis is running');
      return null;
    }
    return Math.min(times * 300, 5000);
  },
  enableOfflineQueue: false,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis client connected'));
redis.on('error', (err: Error) => logger.error(`Redis error: ${err.message}`));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export default redis;
