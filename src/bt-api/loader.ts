import { Logger } from '../logger/Logger';
const logger = new Logger();

export class configurationLoader {
  static extendedLogging() {
    return process.env.JEST_EXTENDED_LOGGING != null
      ? process.env.JEST_EXTENDED_LOGGING
      : '';
  }

  static extendedRequestLogging() {
    return configurationLoader.extendedLogging().indexOf('Request') > -1;
  }

  static extendedResponseLogging() {
    return configurationLoader.extendedLogging().indexOf('Response') > -1;
  }

  static enhanceStringify(response, ...params) {
    if (configurationLoader.extendedRequestLogging()) {
      if (params[0] != null && params[0] instanceof String) {
        logger.debug(
          'Request.url: ' +
            params[0].replace(/\\n\\t\\t/g, '\n').replace(/\\n/g, '\n'),
        );
      }
      if (params[1] != null) {
        logger.debug('headers: ' + JSON.stringify(params[1], null, '\t'));
      }
    }
    if (response != null) {
      var responseString = JSON.stringify(response, null, '\t');
      if (configurationLoader.extendedResponseLogging()) {
        logger.debug('Response: ' + responseString.replace(/\\n/g, '\n'));
      }
    }
    return responseString;
  }
  static timeout = Number(
    process.env.JEST_TIMEOUT != null ? process.env.JEST_TIMEOUT : 50000,
  );
}
