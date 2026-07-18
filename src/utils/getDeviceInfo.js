import Bowser from "bowser";

export const getDeviceInfo = () => {
  const browser = Bowser.getParser(window.navigator.userAgent);
  return {
    osName: browser.getOSName(),
    osVersion: browser.getOSVersion(),
    browserName: browser.getBrowserName(),
    browserVersion: browser.getBrowserVersion(),
  };
};