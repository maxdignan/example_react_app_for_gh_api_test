/** @todo: This requires redis. */

// import { Request, Response, NextFunction } from 'express';
// import redis from 'redis';
// import { RateLimiterRedis } from 'rate-limiter-flexible';
// import config from '../app.config';

// const redisClient = redis.createClient({
//   host: config.redis.host,
//   port: +config.redis.port,
//   password: process.env.NODE_ENV === 'dev' ? null : config.redis.auth,
//   enable_offline_queue: false,
// });

// redisClient.on('connect', () =>
//   console.log('redis : rate limit client connected'),
// );

// const rateLimiterRedis = new RateLimiterRedis({
//   storeClient: redisClient,
//   points: 10, // Number of points
//   duration: 4, // Per second
// });

// export const limiter = (req: Request, res: Response, next: NextFunction) => {
//   rateLimiterRedis
//     .consume(req.connection.remoteAddress)
//     .then(() => next())
//     .catch(_ => res.status(429).json(2));
// };

// export type RateLimiter = typeof limiter;
