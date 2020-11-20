import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';

import { ParamsError } from '../util/api-errors';
import { VRSuite, Application } from '../schema';
import { AsyncApi, Auth } from '../middleware';
import { VisualRegressionWithoutID } from 'src/models';

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: any,
  cb: (msg: string | null, status: boolean) => void,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('Please upload only images.', false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Second argument limits to N images.
const uploadFiles = upload.array('files[]', 50);

const uploadImages = (req: Request, res: Response, next: NextFunction) => {
  uploadFiles(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Too many images.
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        console.log('error', err);
        throw err;
      }
    } else if (err) {
      // Every other error.
      console.log('error', err);
      throw err;
    }
    // Everything is ok.
    next();
  });
};

/**
 * Creates a new visual regression suite.
 * @todo:
 * We need to upload and process these images somewhere.
 */
export const vrSuite = (routes: Router, auth: Auth, asyncApi: AsyncApi) => {
  routes.post(
    '/vr',
    auth,
    uploadImages,
    asyncApi(async (req: Request, res: Response) => {
      if (!req.body.branch || !req.body.app || !req.files?.length) {
        throw new ParamsError();
      }

      console.log('body', req.body);
      console.log('files', req.files);

      // Find application
      let app = await Application.findOne({
        name: req.body.app,
        members: req.decoded.id,
      });

      // No app exists, create one
      if (!app) {
        app = await new Application({
          name: req.body.app,
          framework: req.body.framework,
          members: [req.decoded.id],
        }).save();
      }

      // Create subdocuments for snapshots.
      const results = (req.files as Express.Multer.File[]).map(
        (file, index): VisualRegressionWithoutID => ({
          image: 'test', // This will be the URL image has been uploaded to.
          name: req.body.fileNames[index],
          title: req.body.pageTitles[index],
          url: req.body.urls[index],
          metrics: JSON.parse(req.body.metrics[index]),
        }),
      );

      // Create new suite.
      const { id } = await new VRSuite({
        results,
        creator: req.decoded.id,
        branch: req.body.branch,
        application: app.id,
      }).save();

      res.json({ id, app: app.id, images: req.files.length });
    }),
  );

  /**
   * Returns list of shallow VR suites.
   * @example:
   * curl localhost:9000/api/vr
   */
  routes.get(
    '/vr',
    auth,
    asyncApi(async (req: Request, res: Response) => {
      if (!req.query.appId) {
        throw new ParamsError();
      }
      // @todo: Pagination
      const suites = await VRSuite.find({
        creator: req.decoded.id,
        application: req.query.appId as string,
      });
      return res.json(suites);
    }),
  );

  /**
   * Returns single, deep VR suite.
   */
  routes.get(
    '/vr/:id',
    auth,
    asyncApi(async (req: Request, res: Response) => {
      if (!req.query.appId) {
        throw new ParamsError();
      }
      const suite = await VRSuite.findOne({
        creator: req.decoded.id,
        _id: req.params.id,
        application: req.query.appId as string,
      });
      res.json(suite);
    }),
  );
};
