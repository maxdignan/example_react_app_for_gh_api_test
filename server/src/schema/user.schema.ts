import mongoose from 'mongoose';
import shortid from 'shortid';

import { UserModel } from '../models';

type UserDocument = mongoose.Document & UserModel;

const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: shortid.generate,
    },
    name: String,
    organization: Number,
    email: {
      type: String,
      required: true,
      unique: true,
      set: (email: string) => email.toLowerCase(),
    },
    password: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    // when user logged in last
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform: (model, object) => {
        delete object.password;
        object.id = object._id;
        delete object._id;
        return object;
      },
    },
  },
);

export const User = mongoose.model<UserDocument>('User', schema);
