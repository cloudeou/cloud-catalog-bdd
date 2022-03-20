import { xml2js } from 'xml2js';
import { StringUtils } from './StringUtils';

import { Logger } from '../../logger/Logger';
const logger = new Logger();

export class XmlParser {
  /**
   * Returns true if given array is null / undefined or no elements
   * @param {JSON} json
   */
  /**
   * Removes any null or undefined elements from given array and returns clean array
   *
   * @param {Object} arr Specifies array of any type of objects
   */
  static async xmlToJson(data) {
    let newdata = data.text.replace('\ufeff', '');
    newdata = StringUtils.replaceString(newdata, '<soap:', '<');
    newdata = StringUtils.replaceString(newdata, '</soap:', '</');
    const parser = new xml2js.Parser({
      explicitArray: false,
      explicitRoot: false,
      trim: true,
    });
    return parser.parseStringPromise(newdata).then(function (res) {
      logger.debug(
        JSON.stringify(
          res.Body.GetCustomerInfo_V2Response.GetCustomerInfo_V2Result,
        ),
      );
      return res.Body.GetCustomerInfo_V2Response.GetCustomerInfo_V2Result;
    });
  }
  static async getDatafromXml(data) {
    const newdata = await this.xmlManipulator(data);
    logger.info(JSON.stringify(newdata));
    const result = await this.xmlToJson(newdata);
    return result;
  }
  static async xmlManipulator(data) {
    let newdata = data.text.replace('\ufeff', '');
    newdata = StringUtils.replaceString(newdata, '<soap:', '<');
    newdata = StringUtils.replaceString(newdata, '</soap:', '</');
    newdata = StringUtils.replaceString(newdata, '<S:Body', '<Body');
    newdata = StringUtils.replaceString(newdata, '</S:Body', '</Body');
    newdata = StringUtils.replaceString(newdata, '<ns4:', '<');
    newdata = StringUtils.replaceString(newdata, '</ns4:', '</');
    logger.info(newdata);
    return newdata;
  }
  static async getDescriptionInfoFromDst(data) {
    logger.enterMethod('getDataforDST');
    const finobj = data.Body.getWorkOrderResponse.workOrder.remarkList;
    const details = finobj.typeCode[0].descriptionTxt;
    let ordprod = StringUtils.replaceAll(details, 'PowerG', '');
    ordprod = StringUtils.replaceAll(ordprod, '2Gig', '');
    ordprod = StringUtils.replaceAll(ordprod, '[^a-zA-Z0-9_]', '');
    logger.info(`finalstring:${ordprod}`);

    return ordprod;
  }
}
