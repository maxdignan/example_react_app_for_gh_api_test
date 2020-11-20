require('dotenv').config();

import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import cors from 'cors';
import config from './app.config';
import db from './db/database';
import { auth, asyncApi } from './middleware';
import * as routes from './routes';

// server setup
const app = express();
const port = process.env.PORT || 9000;

console.log(`loading server on ${process.env.NAME} port ${port} ...`);

http.createServer(app).listen(port, () => {
  db(config.mongo.url);
  console.log('server started!');
});

app.set('port', port);
app.set('secret', config.secret);
app.disable('x-powered-by');

// cors middleware. might not be needed in prod. todo @brad
cors({ origin: true });
app.use(cors());

// api routes
const apiRoutes = express.Router();
apiRoutes.use(bodyParser.json());
apiRoutes.use(bodyParser.urlencoded({ extended: true }));
routes.auth(apiRoutes, asyncApi);
routes.user(apiRoutes, auth, asyncApi);
routes.vrSuite(apiRoutes, auth, asyncApi);
routes.app(apiRoutes, auth, asyncApi);
app.use('/api', apiRoutes);

// meta routes
app.get('/health', (req, res) => res.status(200).json(1));
app.get('/version', (req, res) =>
  res.status(200).json(require('../package.json').version),
);

// all others
app.use('*', (req, res) => res.status(404).json({ error: 'not found' }));
