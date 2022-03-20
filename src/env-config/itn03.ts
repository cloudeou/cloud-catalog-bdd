export const envConfig = {
  envName: "it03",
  baseUrl:
    "https://flcncapp-itn03.tsl.telus.com:443/OSSJ/OrderManagement/NcOssjOrderManagementWebService",
  contentType: "application/soap+xml",
  provideTemplate: "provideTemplate.xml",
  ncdb: {
    user: "APPTEST_AUTOMATION",
    password: "Telus2020",
    connectString: "NCMBE3IT:41521/NCMBE3ITsv1",
  },
  productInventory: {
    baseUrl:
      "https://apigw-st.tsl.telus.com/product/fifaProductInventoryManagement/v1/product",
    clientId: "c19b9aa0-82b4-4aaf-92c0-e62e3ad5880c",
    clientSecret:
      "12711511-fa3f-4d4e-bebd-6c28ecc51871e213fac9-3c02-43ee-9a9d-f5e8da6ddeaa",
    scope: 195,
  },
  token: {
    tokenHost: "https://apigw-st.tsl.telus.com",
    tokenPath: "/st/token",
  },
};
