import http from 'http';
import puppeteer from 'puppeteer';

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
 * @deprecated
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
  console.error('app : fatal error :', err);
  process.exit(0);
};

/**
 * Read all properties from element.
 * Example - get all classes from <button> elements on the page:
 * mapAllElementValues('button', 'className');
 */
export const allPropsForElement = async (
  page: puppeteer.Page,
  element: string,
  prop = 'className',
): Promise<string[]> => {
  const elements = await page.$$(element);
  const props = await Promise.all(elements.map(el => el.getProperty(prop)));
  return (await Promise.all(props.map(p => p.jsonValue()))) as string[];
};

/**
 * Comment.
 */
export const getElementClassCounts = (classes: string[][]) => {
  // Map of the amount of times a button class recurs
  const classCountMap = classes.reduce((a, b) => {
    if (!b.length) {
      return a;
    }
    // Because the classes can be as:
    // ["class list-1", "class list-2", "class etc..."]
    // or simply:
    // ["class"]
    b.join(' ')
      .split(' ')
      .forEach(c => (c in a ? ++a[c] : (a[c] = 1)));
    return a;
  }, {} as { [key: string]: number });

  console.log(classCountMap);

  // Order items by highest recurrence
  let result = Object.keys(classCountMap).sort((a, b) =>
    classCountMap[a] > classCountMap[b] ? -1 : 1,
  );

  // Remove classes that are not derived from base class, join base class with sub classes.
  const baseClass = result[0];
  const childClasses = result
    .slice(1)
    .filter(cls => cls.includes(baseClass))
    .map(cls => `${baseClass} ${cls}`);

  // const buttonClassNames = buttonClasses.map(
  //   x => '.' + x.split(' ').join(' .'),
  // );

  return [baseClass, ...childClasses];
};

/**
 * Open OS-default web browser and go to url.
 */
export const openBrowserTo = (url: string) => {
  const start =
    process.platform == 'darwin'
      ? 'open'
      : process.platform == 'win32'
      ? 'start'
      : 'xdg-open';
  require('child_process').exec(start + ' ' + url);
};

/**
 * Example.
 */

export const Example = () => {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('Enter your Emtry login email: ', (name: string) => {
    console.log(`Hi ${name}!`);
    readline.close();
  });
};
