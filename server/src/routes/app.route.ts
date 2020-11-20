import { Router, Request, Response } from 'express';

import { Application } from '../schema';
import { Auth, AsyncApi } from '../middleware';

export const app = (routes: Router, auth: Auth, asyncApi: AsyncApi) => {
  /**
   * Example
   * curl http://localhost:9000/api/app
   */
  routes.get(
    '/app',
    auth,
    asyncApi(async (req: Request, res: Response) => {
      const apps = await Application.find({
        members: req.decoded.id,
      }).select({ name: 1, created: 1, id: 1, framework: 1 });
      res.json(apps || []);
    }),
  );
};
