import { Logger } from '../logger/Logger';
const logger = new Logger();

export class GlobalVars {
  static TestsContextMapsByTitles = new Map();

  static addToTestContextMapByTitle(testTitle, feaContext) {
    logger.debug(
      `Added test title ${testTitle}; size: ${GlobalVars.TestsContextMapsByTitles.size}`,
    );
    GlobalVars.TestsContextMapsByTitles.set(testTitle, feaContext);
  }

  static getAllTestContextMapsByTitle() {
    return GlobalVars.TestsContextMapsByTitles;
  }

  static getReportContextByTestTitle(title) {
    return GlobalVars.TestsContextMapsByTitles.get(title);
  }
}
