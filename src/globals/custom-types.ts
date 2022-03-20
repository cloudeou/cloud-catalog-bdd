export type CmdParams = {
  env: string;
};

export type AddressCreationMeta = {
  addressType: string;
  techType?: string;
  streetNumberId?: bigint;
  deviceType?: string;
  scenarioType?: string;
  oltName?: string;
  env?: string;
  fmsAddressId?: bigint;
  techTypeId?: bigint;
  gisSupportId?: bigint;
  obd?: string;
  dpu?: string;
};

export type ConfigTestDataAsset = {
  url: string;
  urlcontains: string;
  testId: string;
  dataFile: string;
  dataSheet: string;
};

export type DbTables = {
  nc_objects: string;
  nc_params_ix: string;
  nc_params: string;
  nc_list_values: string;
  nc_object_types: string;
  nc_references: string;
  nc_po_tasks: string;
  nc_attributes: string;
};

export type DbConfig = {
  user: string;
  password: string;
  connectString: string;
  externalAuth: boolean;
  tables: DbTables;
};

export type AddressUnit = {
  // createAddressunitAndFreePortRFS
  streetNumberId: bigint;
  fmsAddressId: bigint;
  fmsAddressV: string;
  gisSupportId: bigint;
  techTypeId: bigint;
  techType: string;
  customerId: bigint;
  nodeName: string;
  nodePort: string;
  nodeRack: string;
  nodeShelf: string;
  nodeSlot: string;
  ontNode: string;
  ontPort: string;
  ontSlot: string;
  slid: string;
  deviceType: string;
  accessPortProfile: string;
};

export type AddressUnitBindVarsResponse = {
  outBinds: {
    formatedAddress: any;
    freePort: any;
    AU: any;
  };
};

export type NcbData = {
  // insert-ncb-data
  pathId: bigint;
  addressId: bigint;
  status: string;
  eqtStatus: string;
};

export type PgDbConfig = {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
  externalAuth?: boolean;
  tables?: DbTables;
};

type ObjectRepo = {
  base: string;
};
type ValidationsMeta = {
  base: string;
};
type DataFiles = {
  base: string;
};

export type Locations = {
  or: ObjectRepo;
  valsmeta: ValidationsMeta;
  dataFiles: DataFiles;
  telusapis: TelusApi;
  adcapis: AdcApi;
};

export type TestApp = {
  url: string;
  urlcontains: string;
  user: string;
  password: string;
};

export type Timeouts = {
  test: number;
  apitest: number;
  uitest: number;
  pageload: number;
  urlchange: number;
  scriptasyncload: number;
  implicit: number;
  element: number;
  sleep: number;
};

export type Config = {
  locations: Locations;
  logLevel: string;
  envType: string;
  throwsErrorFromLogger: boolean;
  dataSetDetailedReportsDir: string;
  browser: string;
  testapp: TestApp;
  dbconfig: DbConfig;
  itfDbConfig: DbConfig;
  pgDbConfig: PgDbConfig;
  telusapis: TelusApis;
  btapiconfig: BtApi;
  timeouts: Timeouts;
  testDataAssets: ConfigTestDataAsset[];
};

export type AdcApis = {
  isCustomerAvailable: AdcApi;
  getCustomerInfo: AdcApi;
};

export type AdcApi = {
  base: string;
  endpoint: string;
  contentType: string;
  fileForBody: string;
  keywordsToReplace: string[];
  authUser: string;
  authPass: string;
};

export type BtApi = {
  JEST_BTAPI_ENDPOINT: string;
  JEST_BTAPI_ENDPOINT_SHOPPING_CART: string;
  BTAPI_USERNAME: string;
  BTAPI_PASS: string;
  JEST_CREATECUSTOMER_ENDPOINT: string;
  SERVICE_QUALIFICATION_ENDPOINT: string;
};

export type TelusApis = {
  workOrderCompletion: TelusApi;
  releaseActivation: TelusApi;
  shipmentOrderCompletion: TelusApi;
  manualTaskCompletion: TelusApi;
  searchAvailableAppointments: TelusApi;
};

export type TelusApi = {
  base: string;
  endpoint: string;
  contentType: string;
  fileForBody: string;
  keywordsToReplace: string[];
};

export type TestCaseResultObject = {
  caseid: string;
  description: string;
  steps: any[];
  datasets: TestDatasetObject[];
  finalScreenshotLocation: string;
  result: string;
};

export type TestDatasetObject = {
  request: {};
  response: {};
  expected: {};
  result: string;
  screenshotLocation: string;
  error: {};
  indexId: number;
};

export type ValidationTestCaseObject = {
  tc_identifier: string;
  validations: ValidationObject[];
};
export type ValidationObject = {
  validation_identifier: string;
  type: string;
  enabled: boolean;
  validation_params: ValidationParams[];
  suites: ValidationSuiteInfo[];
};
export type ValidationParams = { param: string; type: string };

export type ValidationSuiteInfo = { suite_name: string; enabled: boolean };
