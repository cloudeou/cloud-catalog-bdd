import { Identificators } from './Identificators';
import { btapi } from ' ./../../src/bt-api/btapi';

export default class PreconditionContext {
  public identificator = Identificators.preConditionContext;
  private addressType: string;
  private technologyType: string;
  private distributionChannel: string;
  private distributionChannelExternalId: string;
  private customerCategory: string;
  private allAddreses: undefined | any[] = undefined;
  private addressId: string;
  private externalCustomerId: any;
  private customerObjectId: string;
  private streetNumberId: bigint;
  private oltName: string;
  private deviceType: string;
  private scenarioType: string;
  private errors = [];
  private market: string;
  private odb: any;
  private dpu: any;
  private bootstrapData: Object;

  public getMarket() {
    return this.market;
  }

  public setMarket(value: string) {
    this.market = value;
  }

  public getErrors() {
    return this.errors;
  }
  public setErrors(error: string) {
    this.errors.push(error);
  }

  public getStreetNumberId() {
    return this.streetNumberId;
  }

  public getOltName() {
    return this.oltName;
  }

  public setStreetNumberId(value: bigint) {
    this.streetNumberId = value;
  }
  public setOltName(value: string) {
    this.oltName = value;
  }
  // public setAllAddressesFromEnv() {
  //   try {
  //     const tempAddresses: string[] = JSON.parse(process.env.addresses);
  //     this.allAddreses = tempAddresses;
  //   } catch (error) {
  //     this.allAddreses = [];
  //   }
  // }

  public getAddressFromEnvPreset() {
    if (!this.allAddreses) {
      try {
        const tempAddresses: any[][] = JSON.parse(process.env.bootstrapData);
        console.log('tempAddresses', tempAddresses);
        this.allAddreses = tempAddresses.pop();
        process.env.bootstrapData = JSON.stringify(tempAddresses);
      } catch (error) {
        this.allAddreses = [];
      }
    }
    console.log(this.allAddreses);
    return this.allAddreses['@id'];
  }

  public setBootstrapData() {
    try {
      const tempData: Object[] = JSON.parse(process.env.bootstrapParams);
      this.bootstrapData = tempData.pop();
      process.env.bootstrapParams = JSON.stringify(tempData);
    } catch (error) {
      throw Error('No Bootstrap Data found in env!');
    }
  }
  public getBootstrapData(key: string) {
    const value = this.bootstrapData[key];
    if (value !== undefined) {
      return value;
    } else {
      throw Error(`No value found in getBootstrapData method by key ${key}`);
    }
  }
  public getAddressType() {
    return this.addressType;
  }
  public setAddressType(value: string) {
    this.addressType = value;
  }

  public getTechnologyType() {
    return this.technologyType;
  }
  public setTechnologyType(value: string) {
    this.technologyType = value;
  }

  public getDistributionChannel() {
    if (this.distributionChannel == null) {
      this.distributionChannel = btapi.data.distributionChannel.CSR;
    }
    return this.distributionChannel;
  }
  public setDistributionChannel(value: string) {
    value = value.toUpperCase();
    this.distributionChannel = btapi.data.distributionChannel[value] ?? value;
  }

  public getDistributionChannelExternalId() {
    return this.distributionChannelExternalId;
  }

  public setDistributionChannelExternalId(value: string) {
    this.distributionChannelExternalId = value;
  }

  public setDeviceType(value: string) {
    this.deviceType = value;
  }

  public setScenarioType(value: string) {
    this.scenarioType = value;
  }

  public getDeviceType() {
    return this.deviceType;
  }

  public setOdb(value) {
    this.odb = value;
  }

  public getOdb() {
    return this.odb;
  }

  public setDpu(value) {
    this.dpu = value;
  }

  public getDpu() {
    return this.dpu;
  }

  public getScenarioType() {
    return this.scenarioType;
  }

  public getCustomerCategory() {
    if (this.customerCategory == null) {
      this.customerCategory = btapi.data.customerCategory.CONSUMER;
    }
    return this.customerCategory;
  }
  public setCustomerCategory(value: string) {
    value = value.toUpperCase();
    switch (value) {
      case 'RESIDENTIAL':
        this.customerCategory = btapi.data.customerCategory.CONSUMER;
        break;
      case 'CUSTOMER':
        this.customerCategory = btapi.data.customerCategory.CONSUMER;
        break;
      case 'COMMERCIAL':
        this.customerCategory = btapi.data.customerCategory.BUSINESS;
        break;
      case 'BUSINESS':
        this.customerCategory = btapi.data.customerCategory.BUSINESS;
        break;
      default:
        throw new Error(
          'Choose customer category either as RESIDENTIAL or COMMERCIAL',
        );
        break;
    }
  }

  public getAddressId() {
    return this.addressId;
  }
  public setAddressId(value: string) {
    this.addressId = value;
  }

  public getExternalCustomerId() {
    return this.externalCustomerId;
  }
  public setExternalCustomerId(value: number) {
    this.externalCustomerId = value;
  }

  public getCustomerObjectId() {
    return this.customerObjectId;
  }
  public setCustomerObjectId(value: string) {
    this.customerObjectId = value;
  }
}
