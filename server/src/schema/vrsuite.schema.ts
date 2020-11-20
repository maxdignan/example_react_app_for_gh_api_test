import mongoose from 'mongoose';
import shortid from 'shortid';

import { VisualRegressionSuiteModel } from '../models';

type VRSuiteDocument = mongoose.Document & VisualRegressionSuiteModel;

/** The snapshot document. */
const vrSchema = new mongoose.Schema(
  {
    /** Name of top level route. */
    name: {
      type: String,
      required: true,
    },
    /** Full URL this screenshot came from. */
    url: String,
    /** Page title this image came from. */
    title: String,
    /** Arbitrary metric object. */
    metrics: {
      layout: Number,
      script: Number,
      heap: Number,
    },
    /** How much has this document changed since last? */
    // delta: Number,
    /** The URL in s3 (or wherever). */
    image: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: shortid.generate,
    },
    /** User document id of user that created suite. */
    creator: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    /** Application document id. */
    application: {
      type: String,
      required: true,
    },
    results: [vrSchema],
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

export const VRSuite = mongoose.model<VRSuiteDocument>('VRSuite', schema);
