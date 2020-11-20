import http from 'http';

import { AppArgs } from './models/args';

/**
 * Turn process arguments into object. Example:
 * node config/build.js -lHRs --ip=$HOST --port=$PORT --env=dev
output
{ 
  l: true,
  H: true,
  R: true,
  s: true,
  ip: '127.0.0.1',
  port: '8080',
  env: 'dev'
}
 */
export const getArgs = (): Partial<AppArgs> => {
  const args: { [key: string]: any } = {};
  process.argv.slice(2, process.argv.length).forEach((arg: string) => {
    // long arg
    if (arg.slice(0, 2) === '--') {
      const longArg = arg.split('=');
      const longArgFlag = longArg[0].slice(2, longArg[0].length);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    // flags
    else if (arg[0] === '-') {
      const flags = arg.slice(1, arg.length).split('');
      flags.forEach(flag => (args[flag] = true));
    }
  });
  return args;
};

/**
 * Get a unique array from a collection by key.
 */
export const uniqueArrayBy = <T>(key: string, arr: T[]): T[] =>
  arr.filter(
    (a: { [key: string]: any }, i, source) =>
      source.findIndex((s: { [key: string]: any }) => s[key] === a[key]) === i,
  );

/**
 * Promisified wrapper around http get.
 */
export const xhrGet = (url: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const req = http.get(url);
    req.on('error', () => reject(false));
    req.on('finish', () => resolve(true));
  });
};

/**
 * Logs error and quits node process.
 */
export const exitWithError = (err: string) => {
  console.error(err);
  process.exit(0);
};
