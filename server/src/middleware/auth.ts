import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

/**
 * JWT authorization middleware.
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Mocked up for local dev.
  req.decoded = { id: 'S_c0cRR-N' };
  next();
  return;
  const token = req.headers['x-access-token'] || req.body.token;
  if (token) {
    jwt.verify(
      token,
      req.app.settings.secret,
      (err: VerifyErrors | null, decoded: object | undefined) => {
        if (err) {
          return res.status(403).json({ success: false });
        }
        req.decoded = decoded as { id: string };
        next();
      },
    );
  } else {
    res.status(403).json({ success: false });
  }
};

export type Auth = typeof auth;
