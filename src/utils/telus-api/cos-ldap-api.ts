import { envConfig } from "../../env-config";
import { OauthToken } from "./oauth-token";
import { axiosInstance } from "../../axiosInstance";

export class COSLDAPModifier {
  private _oauthToken: any;
  public requestBody: string;
  public resourceId: string;
  public originalUUID: string;
  public newUUID: string;

  constructor(resourceId: string, origUUID: string, newUUID: string) {
    this._oauthToken = new OauthToken(
      envConfig.cosldap.clientId,
      envConfig.cosldap.clientSecret
    );
    this.requestBody = "";
    this.resourceId = resourceId;
    this.originalUUID = origUUID;
    this.newUUID = newUUID;
  }

  public async disconnectResource() {
    try {
      const token = await this._oauthToken.getToken(envConfig.cosldap.scope);
      const params = {
        serviceType: "Email Service",
        provider: "COS",
        sourceSystem: "NETCRACKER",
        sourceSystemResourceId: this.resourceId,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
        env: envConfig.envName,
      };
      const response = await axiosInstance({
        method: "delete",
        url: `${envConfig.cosldap.baseUrl}?${Object.entries(params)
          .map(([key, val]) => `${key}=${val}`)
          .join("&")}`,
        headers,
      });
      return response;
    } catch (error) {
      throw new Error(`Error while disconnecting in COSLDAP: ${error}`);
    }
  }

  public async registerResource() {
    this.generateBody();
    try {
      const token = await this._oauthToken.getToken(envConfig.cosldap.scope);
      const headers = {
        "Content-Type": envConfig.cosldap.contentType,
        Authorization: `Bearer ${token}`,
        env: envConfig.envName,
      };
      const response = await axiosInstance({
        method: "post",
        url: envConfig.cosldap.baseUrl,
        headers,
        data: this.requestBody,
      });
      return response;
    } catch (error) {
      throw new Error(`Error while registering in COSLDAP: ${error}`);
    }
  }

  private generateBody() {
    this.requestBody = JSON.stringify({
      serviceType: "Email Service",
      provider: "COS",
      state: "active",
      password: "AAiWMTO48oD76",
      sourceSystem: "NETCRACKER",
      sourceSystemResourceId: this.resourceId,
      emailServiceProvider: "gsuite",
      emailServiceProviderId: this.newUUID,
    });
  }
}
