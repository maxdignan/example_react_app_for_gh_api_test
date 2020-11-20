import { Router, Request, Response } from 'express';
import util from 'util';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { ParamsError, UserNotFoundError } from '../util/api-errors';
import config from '../app.config';
import { UserModel } from '../models';
import { User, Application } from '../schema';
// import { EmailService } from '../email/email.service';
import { Auth, AsyncApi } from '../middleware';

const bcryptCompare = util.promisify(bcrypt.compare);

export const user = (routes: Router, auth: Auth, asyncApi: AsyncApi) => {
  /**
   * Creates a new user account.
   * @example
   * curl -d '{"name": "Big Jim", "email": "brizad@gmail.com", "password": "password"}' -H "Content-Type: application/json" -X POST localhost:9000/api/user
   */
  routes.post(
    '/user',
    asyncApi(async (req: Request, res: Response) => {
      const { name, email, password } = req.body;

      if (!email || !password) {
        throw new ParamsError();
      }

      // pick body fields to define base model
      let model: Pick<UserModel, 'name' | 'email' | 'password'> = {
        name,
        email,
        password,
      };

      // hash and set password
      const hashedPassword = await bcrypt.hash(model.password, 2);
      model = { ...model, password: hashedPassword };

      const user = await new User(model).save();

      console.log('user : registered new user :', email);

      // client is good to go
      res.json({ id: user.id });

      // send email to new user, yay!
      // EmailService.send({
      //   to: model.email,
      //   bcc: true,
      //   subject: `Welcome to ${config.formattedName}!`,
      //   template: 'registration',
      //   context: {
      //     name: model.name || 'Anon',
      //     email: model.email,
      //   },
      // });
    }),
  );

  /**
   * Client requests a user has an email sent to reset password.
   */
  // routes.post(
  //   '/user/reset-password',
  //   limiter,
  //   asyncApi(async (req, res) => {
  //     const { email } = req.body;

  //     if (!email) {
  //       throw new ParamsError();
  //     }

  //     // console.log(clc.yellow(`user : finding email ${email}`));

  //     const user = (await User.findOne({ email, active: true })) as UserModel;

  //     if (user === null) {
  //       throw new UserNotFoundError();
  //     }

  //     const token = await new Promise<string>(resolve => {
  //       crypto.randomBytes(20, (err, buf) => {
  //         resolve(buf.toString('hex'));
  //       });
  //     });

  //     // set token and expiry
  //     user.passwordToken = token;
  //     user.passwordTokenExpires = Date.now() + 3600000;
  //     user.save({ validateBeforeSave: false });

  //     // send email
  //     EmailService.send({
  //       to: user.email,
  //       subject: `Reset your ${config.formattedName} password`,
  //       template: 'password',
  //       context: {
  //         name: user.name,
  //         url: `http://portal.${config.domain}/change-password/${token}`,
  //       },
  //     });

  //     res.json(1);
  //   }),
  // );

  /**
   * Validate provided token matches one saved from /user/reset-password.
   */
  // routes.post(
  //   '/user/validate-token',
  //   limiter,
  //   asyncApi(async (req, res) => {
  //     const { token } = req.body;

  //     if (!token) {
  //       throw new ParamsError();
  //     }

  //     console.log(clc.yellow(`user : checking password reset token ${token}`));

  //     const user = await User.findOne({
  //       passwordToken: token,
  //       passwordTokenExpires: { $gt: Date.now() },
  //     }).lean();

  //     if (user === null) {
  //       throw new Error('Invalid token.');
  //     }

  //     res.json(1);
  //   }),
  // );

  /**
   * Endpoint after token has been validated.
   */
  // routes.post(
  //   '/user/set-password',
  //   limiter,
  //   asyncApi(async (req, res) => {
  //     const { password, confirmPassword, token } = req.body;

  //     if (!password || !confirmPassword || !token) {
  //       throw new ParamsError();
  //     }
  //     if (password !== confirmPassword) {
  //       throw new Error('Passwords must match.');
  //     }

  //     console.log(
  //       clc.yellow(`user : changing password for user with token ${token}`),
  //     );

  //     const user = await User.findOne({
  //       passwordToken: token,
  //       passwordTokenExpires: { $gt: Date.now() },
  //     });

  //     if (user === null) {
  //       throw new Error('Invalid token.');
  //     }

  //     user.passwordToken = '';
  //     const hash = await bcrypt.hash(password, 2);
  //     user.password = hash;
  //     const saved = await user.save();

  //     if (saved === null) {
  //       throw new Error('Error saving password.');
  //     }

  //     res.json(1);
  //   }),
  // );

  /**
   * Change password from settings view on auth'd client (not email flow).
   */
  // routes.post(
  //   '/user/change-password',
  //   auth,
  //   limiter,
  //   asyncApi(async (req, res) => {
  //     const { currentPassword, password, confirmPassword } = req.body;

  //     if (!currentPassword || !password || !confirmPassword) {
  //       throw new ParamsError();
  //     } else if (password !== confirmPassword) {
  //       throw new Error('Passwords must match.');
  //     } else if (password.length < 8) {
  //       throw new Error('Password must be at least 8 characters.');
  //     }

  //     console.log(
  //       clc.yellow(`user : changing password for user ${req.decoded.id}`),
  //     );

  //     const user = await User.findOne({ _id: req.decoded.id });

  //     if (user === null) {
  //       throw new UserNotFoundError();
  //     }

  //     const decrypted = await bcryptCompare(currentPassword, user.password);

  //     if (decrypted !== true) {
  //       throw new Error('Current password is incorrect.');
  //     } else {
  //       const hash = await bcrypt.hash(password, 2);
  //       user.password = hash;
  //       await user.save();
  //       res.json(1);
  //     }
  //   }),
  // );

  /*
   * The control panel will show an error,
   * so we don't let this hold up the client.
   * Keep in mind the website hits this, for now.
   */
  // routes.post(
  //   '/user/help',
  //   // auth,
  //   asyncApi(async (req, res) => {
  //     const { name, email, message } = req.body;
  //     if (email === undefined || message === undefined) {
  //       throw new ParamsError();
  //     }
  //     res.json(1);
  //     // EmailService.sendHelp({ name, email, message });
  //   }),
  // );

  /**
   * Update text-based user account information.
   */
  // routes.put(
  //   '/user',
  //   auth,
  //   limiter,
  //   asyncApi(async (req, res) => {
  //     const { name, company, phone } = req.body;
  //     const user = await User.findOne({ _id: req.decoded.id });
  //     if (user === null) {
  //       throw new UserNotFoundError();
  //     }
  //     if (name) user.name = name;
  //     if (company) user.company = company;
  //     if (phone) user.phone = phone;
  //     await user.save();
  //     res.json(1);
  //   }),
  // );

  /*
   * Flag user account as not active.
   */
  routes.delete(
    '/user',
    auth,
    asyncApi(async (req: Request, res: Response) => {
      console.log(`user : deactivating account : ${req.decoded.id}`);
      const user = await User.findOne({ _id: req.decoded.id });
      if (!user) throw new UserNotFoundError();
      user.active = false;
      await user.save({ validateBeforeSave: false });
      res.json(1);
    }),
  );
};
