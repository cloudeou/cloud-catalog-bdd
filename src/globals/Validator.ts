import { ValidationObject, ValidationTestCaseObject } from './custom-types';

require(`../globals/MyTypeDefs`);
import { StringUtils } from '../utils/common/StringUtils';
import { Logger } from '../logger/Logger';
import { brconfig as config } from '../../br-config';
import { FileSystem } from '../utils/common/FileSystem';
const logger = new Logger();
export class Validator {
  /**
   *
   * @param {String} valFileName Specifies validation file name
   * @param {String} valTcIdentifier Specifies test case identifier
   * @param {String} valIdentifier Specifies validation identifier
   * @returns {Boolean}
   */
  isValidationEnabled(
    valFileName: string,
    valTcIdentifier: string,
    valIdentifier: string,
  ): boolean {
    logger.enterMethod('isValidationEnabled');
    const valFileNameWithPath = `${config.getLocationValidatorsMetaForGivenEnv()}/${valFileName}.json`;

    // else {
    //   throw new Error(
    //     `No test case found with identifier [${valTcIdentifier}] found in given validation-sets repository given at ${valFileNameWithPath}`
    //   );
    // }
    logger.exitMethod('isValidationEnabled');
    return false;
  }

  /**
   *
   * @param {ValidationTestCaseObject[]} valObjs
   * @param {String} tcIdentifier
   * @returns {ValidationObject[]}
   */
  getValidtatorsForGivenTestCase(
    valObjs: ValidationTestCaseObject[],
    tcIdentifier: string,
  ): ValidationObject[] {
    if (StringUtils.isEmptyObject(valObjs)) {
      return null;
    }
    if (StringUtils.isEmpty(tcIdentifier)) {
      return null;
    }
    for (let index = 0; index < valObjs.length; index++) {
      if (
        StringUtils.equalsIgnoreCase(valObjs[index].tc_identifier, tcIdentifier)
      ) {
        return valObjs[index].validations;
      }
    }
    return null;
  }

}
