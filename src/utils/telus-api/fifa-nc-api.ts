import { envConfig } from "../../env-config";
import { OauthToken } from "./oauth-token";
import { axiosInstance } from "../../axiosInstance";

export class FIFANCApi {
  private _oauthToken: any;

  constructor() {
    this._oauthToken = new OauthToken(
      envConfig.productInventory.clientId,
      envConfig.productInventory.clientSecret
    );
  }

  public async changeOwnership(
    newUUID: string,
    resourceId: string
  ): Promise<any> {
    try {
      const params = {
        uuid: newUUID,
        targetResourceId: resourceId,
      };
      const url = `${envConfig.changeOwnership.baseUrl}?${Object.entries(params)
        .map(([key, val]) => `${key}=${val}`)
        .join("&")}`;
      const response = await axiosInstance({
        method: "GET",
        url,
      });
      return response;
    } catch (error) {
      throw new Error(`Error in change ownership api request: ${error}`);
    }
  }

  public async getProductInventory(
    ecid: string,
    addressId: string
  ): Promise<any> {
    try {
      const params = {
        "relatedParty.id": ecid,
        "relatedParty.role": "customer",
        "place.id": addressId,
        "place.role": "service%20address",
      };
      console.log("getting token");
      const token = await this._oauthToken.getToken(
        envConfig.productInventory.scope
      );
      console.log("token", token);
      const headers = {
        Authorization: `Bearer ${token}`,
        env: envConfig.envName,
      };
      const url = `${envConfig.productInventory.baseUrl}?${Object.entries(
        params
      )
        .map(([key, val]) => `${key}=${val}`)
        .join("&")}`;
      console.log(url);
      const response = await axiosInstance({
        method: "GET",
        url,
        headers,
      });
      //console.log(response);
      return response;
    } catch (error) {
      throw new Error(
        `Error while sending product inventory request: ${error}`
      );
    }
  }
}
