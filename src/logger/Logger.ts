import * as fs from 'fs';
import * as util from 'util';

import { Enums } from '../utils/common/Enums';
import { DateUtils } from '../utils/common/DateUtils';

const LogLevel = Object.freeze({
  ENTRY: -100,
  EXIT: -99,
  ERROR: 0,
  RESULT: 1,
  PASS: 2,
  FAIL: 3,
  STEP: 4,
  INFO: 5,
  WARN: 6,
  DEBUG: 7,
  VERBOSE: 8,
  TRACE: 9,
});

const DefaultlogLevel = 'INFO';
//let envcfg = config.getConfigForGivenEnv();

const LogLevelToUse = DefaultlogLevel;
// envcfg.logLevel == null || envcfg.logLevel === undefined
//   ? DefaultlogLevel
//   : envcfg.logLevel;

const throwErrorsFromLogger = false;
let logFileObj = null;

export class Logger {
  constructor(logFileNameWithPath?: string) {
    // console.log(`log constructor ${logFileObj}`);
    if (!!logFileObj) return;

    if (!logFileNameWithPath)
      logFileNameWithPath = `debug-${DateUtils.yyyymmddhhmmssms()}.log`;

    // const exists = fs.existsSync(`${logFileNameWithPath}`);
    // console.log(`log file ${logFileNameWithPath} exists: ${exists}`);
    // if (!exists) {
    //   logFileObj = fs.createWriteStream(logFileNameWithPath, {
    //     flags: 'a',
    //   });
    // }
  }

  enterMethod(d: any) {
    this.log('ENTRY', LogLevelToUse, d);
  }

  exitMethod(d: any) {
    this.log('EXIT', LogLevelToUse, d);
  }

  info(d: any) {
    this.log('INFO', LogLevelToUse, d);
  }

  warn(d: any) {
    this.log('WARN', LogLevelToUse, d);
  }

  debug(d: any) {
    this.log('DEBUG', LogLevelToUse, d);
  }

  step(d: any) {
    this.log('STEP', LogLevelToUse, d);
  }

  result(d: any) {
    this.log('RESULT', LogLevelToUse, d);
  }

  pass(d: any) {
    this.log('PASS', LogLevelToUse, d);
  }

  fail(d: string) {
    this.log('FAIL', LogLevelToUse, d);
    if (throwErrorsFromLogger) throw new Error(d);
  }

  error(d: any) {
    this.log('ERROR', LogLevelToUse, d);
  }

  verbose(d: any) {
    this.log('VERBOSE', LogLevelToUse, d);
  }

  trace(d: any) {
    this.log('TRACE', LogLevelToUse, d);
  }

  private logToFile(d: string) {
    try {
      if (!!logFileObj) {
        logFileObj.write(`${util.format(d)}\n`);
      } else {
        // console.warn(`No log file object found: ${logFileObj}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`ERROR: ${error}`);
    }
  }

  private logToStdOut(d: string) {
    try {
      process.stdout.write(`${util.format(d)}\n`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`ERROR: ${error}`);
    }
  }

  private log(givenLevel: string, setLevel: string, d: string | any[]) {
    try {
      const givenLevelNumber = Enums.getEnumValue(LogLevel, givenLevel);
      const setLevelNumber = Enums.getEnumValue(LogLevel, setLevel);
      // console.log(
      //   `Given level: ${givenLevelNumber} and Set level: ${setLevelNumber}`,
      // );

      const currDateTime = DateUtils.currentDateTime();
      const prefix = `[${currDateTime} ${givenLevel.padStart(
        7,
        ' ',
      )}:'debug-prefix'] `;

      let toPrint = '';
      if (d == null || d === undefined || d.length === 0) {
        toPrint = prefix;
      }
      toPrint = prefix + d;

      if (givenLevelNumber <= setLevelNumber) {
        this.logToStdOut(toPrint);
        this.logToFile(toPrint);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`ERROR: ${error}`);
    }
  }
}
