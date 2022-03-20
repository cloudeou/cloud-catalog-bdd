export const envConfig = {
  envName: "itn04",
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
      "https://apigw-pr.tsl.telus.com/product/fifaProductInventoryManagement/v1/product",
    clientId: "3a87c8cb-552e-4d3d-aff3-0a4cc6c67511",
    clientSecret:
      "eee220d6-0df4-4964-96a9-4fd809f7b4e51c97b36d-5390-4ede-8a11-8c1f20cd91c7",
    scope: 195,
  },
  token: {
    tokenHost: "https://apigw-pr.tsl.telus.com",
    tokenPath: "/token",
  },
};
