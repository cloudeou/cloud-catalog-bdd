import { brconfig } from '../../br-config';
import { Nuller } from '../utils/common/Nuller';

const config = brconfig.getConfigForGivenEnv();

export const GlobalConsts: any = {};
GlobalConsts.defaultTimeOut = 20000;
GlobalConsts.getTimeOut = () => {
  let timeout;
  try {
    timeout = config.timeouts.test;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutImplicit = () => {
  let timeout = null;
  try {
    timeout = config.timeouts.implicit;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutElement = () => {
  let timeout;
  try {
    timeout = config.timeouts.element;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutPage = () => {
  let timeout;
  try {
    timeout = config.timeouts.pageload;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
