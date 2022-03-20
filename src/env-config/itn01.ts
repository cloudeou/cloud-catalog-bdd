export const envConfig = {
  envName: "it01",
  baseUrl:
    "https://flcncapp-itn01.tsl.telus.com/OSSJ/OrderManagement/NcOssjOrderManagementWebService",
  contentType: "application/soap+xml",
  provideTemplate: "provideTemplate.xml",
  ncdb: {
    user: "APPTEST_AUTOMATION",
    password: "Telus2020",
    connectString: "NCMBE1IT:41521/NCMBE1ITsv1",
  },
  cosldap: {
    baseUrl:
      "https://apigw-st.tsl.telus.com/enterprise/serviceInventory/v1/service",
    contentType: "application/json",
    clientId: "816a3968-064a-4901-80b9-adf56e73d632",
    clientSecret:
      "412cc102-ee52-4aa4-8c23-271b40838e90cac74781-751f-4e0e-87ed-befa7f4c35bb",
    scope: 140,
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
