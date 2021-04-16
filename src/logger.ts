import chalk from 'chalk';
import { isDebug } from './util';

const log = console.log;
const purple = chalk.hex('#415de1');

class Logger {
  constructor(private debugMode = isDebug()) {}

  public debug(...obj: unknown[]) {
    if (this.debugMode) log(...obj);
  }

  public time(id: string) {
    if (this.debugMode) console.time(id);
  }

  public timeEnd(id: string) {
    if (this.debugMode) console.timeEnd(id);
  }

  public info(...obj: any) {
    log(chalk.gray(obj));
  }

  public notice(...obj: any) {
    log(chalk.cyan(obj));
  }

  public warn(...obj: any) {
    log(chalk.yellow.bold(obj));
  }

  public error(...obj: any) {
    log(chalk.redBright.bold(obj));
  }

  public startAction(...obj: any) {
    process.stdout.write(`${chalk.gray(obj)}...`);
  }

  public updateAction(...obj: any) {
    process.stdout.write(`${chalk.gray(obj)}`);
  }

  public endAction(...obj: any) {
    process.stdout.write(`${chalk.green.bold(obj)}\n`);
  }

  public dryRunWarning() {
    log(
      chalk.yellow.bold(
        'NOTICE: Dry run detected. All routes will still be processed but no data will be sent to Emtrey.\n',
      ),
    );
  }

  public welcome(args: any) {
    const gray = chalk.grey;
    log(purple.bold('\n============================\n'));
    log(purple.bold('         EMTREY CLI'));
    log(purple('         emtrey.io'));
    log(purple.bold('\n============================\n'));
    log(gray('Parameters:'));
    for (const [key, value] of Object.entries(args)) {
      log(gray(`  ${key}: ${value}`));
    }
    log();
  }
}

export const logger = new Logger();
