import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { AuthError, ParamsError } from '../util/api-errors';
import { User } from '../schema';
import { AsyncApi } from '../middleware';

/**
 * Authorizes an existing user.
 * @example:
* curl -d '{"email":"brizad@gmail.com","password":"password"}' -H "Content-Type: application/json" \
    -X POST localhost:9000/api/auth
 */
export const auth = (routes: Router, asyncApi: AsyncApi) => {
  routes.post(
    '/auth',
    asyncApi(async (req: Request, res: Response) => {
      const { email, password } = req.body;

      if (email === undefined || password === undefined) {
        throw new ParamsError();
      }

      const user = await User.findOne({
        email,
        active: true,
      }).select({ _id: 1, name: 1, email: 1, password: 1 });

      if (user === null) {
        throw new AuthError();
      }

      const decrypted = await bcrypt.compare(password, user.password);

      if (decrypted !== true) {
        throw new AuthError();
      }

      console.log('auth : valid user :', email);

      const token = jwt.sign({ id: user._id }, req.app.settings.secret, {
        expiresIn: '1d',
      });

      // success! send user to client
      res.json({
        ...user.toJSON(),
        token,
      });
    }),
  );
};
