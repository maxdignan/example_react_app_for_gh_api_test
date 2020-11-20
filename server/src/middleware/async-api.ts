import { Request, Response, NextFunction } from 'express';

/**
 * Async error handlers for api routes.
 */
export const asyncApi = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const routePromise = fn(req, res, next);
    if (routePromise.catch) {
      routePromise.catch((error: Error) => {
        console.log(error.message);
        res.status(500).json({ error: error.message });
      });
    }
  };
};

export type AsyncApi = typeof asyncApi;
