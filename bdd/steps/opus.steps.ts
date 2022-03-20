const {
  featureContext,
  postgresQueryExecutor,
} = require("@telus-bdd/telus-bdd");
import { StepDefinitions } from "jest-cucumber";
import { Identificators } from "../contexts/Identificators";
import opusContext from "../contexts/OPUSContext";
import errorContext from "../contexts/ErrorContext";
import ProductInventoryContext from './../contexts/ProductInvetoryContext';
import ResponseContext from './../contexts/ResponseContext';
import PreconditionContext from './../contexts/PreconditionContext';
import { btapi } from '../../src/bt-api/btapi';
import {
  MigrationRequest,
  MigrationRequestType,
} from "../../src/utils/ossj-api/migration-request";
import { COSLDAPModifier } from "../../src/utils/telus-api/cos-ldap-api";
import { FIFANCApi } from "../../src/utils/telus-api/fifa-nc-api";
import {
  setCustomerMigrationError,
} from "../../src/db/dbQueries";
import oracleDriver from "../../src/db/oracleDriver";

export const opusSteps: StepDefinitions = ({ given, and, when, then }) => {
  const migrationRequest = new MigrationRequest();
  const fifaNcApi = new FIFANCApi();
  let preconditionContext = (): PreconditionContext =>
    featureContext().getContextById(Identificators.preConditionContext);
  let responseContext = (): ResponseContext =>
    featureContext().getContextById(Identificators.responseContext);
  const opusContext = (): opusContext =>
    featureContext().getContextById(Identificators.OPUSContext);
  const errorContext = (): errorContext =>
    featureContext().getContextById(Identificators.errorContext);
  const productInventoryContext = (): ProductInventoryContext =>
    featureContext().getContextById(Identificators.productInventoryContext);

  given(/^customer IPTV CFS instance object id is (.*)$/, (paramKey) => {
    try {
      if (process.env.bootstrapData) {
        const value = JSON.parse(process.env.bootstrapData)[0][paramKey];
        console.log(`Setting IPTV CFS instance object id to ${value}`);
        expect(value).not.toBe("");
        expect(value).toBeTruthy();
        if (value === "" || !value)
          errorContext().error = `Parameter IPTV CFS instance object id has an invalid value: ${value}`;
      }
    } catch (error: any) {
      errorContext().error = error;
    }
  });


  given("prepare for migration", async () => {
    try {
      await oracleDriver.connect();
    } catch (error: any) {
      errorContext().error = error;
    }
  });

  given("check no error occured", () => {
    const error = errorContext().error;
    if (error) {
      throw new Error(
        `Skipped because an error occured in previous scenarios: ${error}`
      );
    }
  });

  and(/^set customer (.*): (.*)$/, (paramName, paramKey) => {
    try {
      const value = paramKey;
      console.log(`Setting ${paramName} to ${value}`);
      expect(value).not.toBe("");
      expect(value).toBeTruthy();
      if (value === "" || !value)
        errorContext().error = `Parameter ${paramName} has an invalid value: ${value}`;
      switch (paramName) {
        case "ECID":
          return (opusContext().ecid = value);
        case "location id":
          return opusContext().setAddress('location_id', value);
        case "IPTV CFS instance id":
          return (opusContext().iptv_id = value);
      }
    } catch (error: any) {
      errorContext().error = error;
    }
  });

  when(/^(User|user) try to get product instance(s)?$/, async () => {
    const ecid = opusContext().ecid;
    const addressId = opusContext().getAddress("location_id");
    try {
      const piResponse = await fifaNcApi.getProductInventory(ecid,<string>addressId);

      if (piResponse.status !== 200)
        throw new Error(`Couldn't get product inventori, got status ${piResponse.status}: ${piResponse.data}`);

      return (opusContext().data = piResponse.data)
    } catch (error: any) {
      errorContext().error = error;
    }
  });

  then('response should not contain the next offering', (table) => {
    const data = opusContext().data;
    for (let i = 0; i < data.length; i++) {
      if (data[i].productOffering.id == table[0]['Offer Id']) {
        //expect(data[i].status).toBe('Active');
        errorContext().error = `Error: offering ${table[0]['Offer Id']} should not be presented in response`;
      }
    }
  });

  when('user try to submit order via OSS/J API', async () => {
    const requestData = { iptv_id: `${opusContext().iptv_id}` };
    process.env.bddEnv = "itn03";
    try {
      const response = await migrationRequest.send(requestData, "PROVIDE");
      console.log(response.status);
      if (response.status !== 200)
        throw new Error(
          `Error while sending provide request, status ${response.status}: ${response.data}`
        );
      if (!response.data)
        throw new Error(
          `Error while sending provide request, got empty response`
        );
    } catch (error: any) {
      errorContext().error = error;
    }
  });

  then('validate order is submitted successfully', async () => {
    
  });
  
  when('write error if occured for opus_migration', async () => {
    const error = errorContext().error;
    const ecid = opusContext().ecid;
    const locationId = <string>opusContext().getAddress("location_id");
    await postgresQueryExecutor(setCustomerMigrationError(error, ecid, locationId));
  });

  then('reset customer migrating flag', async () => {
    const locationId = <string>opusContext().getAddress("location_id");
    const ecid = opusContext().ecid;
    await migrationRequest.resetMigrating(ecid, locationId);
  });

  and('validate that all orders are completed successfully', async () => {
    const locationId = <string>opusContext().getAddress("location_id");
    const ecid = opusContext().ecid;
    await migrationRequest.setMigrated(ecid, locationId);
  });

  and('check customer migration went successfuly', async () => {
    //await oracleDriver.closeConnection();
  });

};

/*
1. Update CSV OUTPUT
terget_mailbox(gt.net), alias(t.net), mailbox_id, resource_id, orig_uuid, fr_uuid
2. Create validation feature
3. Add migration date to all tables
*/
