import mongoose from 'mongoose';
import shortid from 'shortid';

import { ApplicationModel } from '../models';

type ApplicationDocument = mongoose.Document & ApplicationModel;

const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: shortid.generate,
    },
    name: {
      type: String,
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    framework: {
      type: Number,
    },
    members: [String],
  },
  {
    toJSON: {
      transform: (model, object) => {
        delete object.__v;
        object.id = object._id;
        delete object._id;
        return object;
      },
    },
  },
);

export const Application = mongoose.model<ApplicationDocument>(
  'Application',
  schema,
);
