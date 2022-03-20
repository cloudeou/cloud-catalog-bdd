const { ClientCredentials } = require("simple-oauth2");
const Https = require("https");
import { envConfig } from "../../env-config";

export class OauthToken {
  token: any;
  tokenExpireTime: number;
  lastAccessFailed: boolean;
  autoRefreshInterval: number;
  private _clientId: string;
  private _clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.token = undefined;
    this.tokenExpireTime = this.getTime();
    this.lastAccessFailed = false;
    this.autoRefreshInterval = 5000;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }

  getTime(addSeconds = 0) {
    return Math.trunc(new Date().getTime() / 1000 + addSeconds);
  }

  async getToken(scope: number) {
    if (this.valid()) {
      return this.token;
    }

    await this.requestToken(scope);
    return this.token;
  }

  valid() {
    try {
      const tokenValid =
        this.token !== undefined && this.tokenExpireTime > this.getTime();
      return tokenValid && this.lastAccessFailed === false;
    } catch (err) {
      return false;
    }
  }

  update(accessToken: any) {
    if (accessToken) {
      this.token = accessToken.token.access_token;
      this.tokenExpireTime = this.getTime(accessToken.token.expires_in - 3); // -3 seconds buffer
      this.lastAccessFailed = false;
      return this.token;
    }
  }

  async autoRefreshToken(scope: number) {
    setInterval(async () => {
      await this.getToken(scope);
    }, this.autoRefreshInterval);
  }

  async requestToken(scope: number) {
    const config = {
      client: {
        id: this._clientId,
        secret: this._clientSecret,
      },
      auth: {
        tokenHost: envConfig.token.tokenHost,
        tokenPath: envConfig.token.tokenPath,
      },
      http: {
        agent: new Https.Agent({ maxSockets: 100, rejectUnauthorized: false }),
      },
      options: {
        authorizationMethod: "body",
      },
    };

    const client = new ClientCredentials(config);

    const tokenParams = {
      scope: scope,
    };

    try {
      const accessToken = await client.getToken(tokenParams);
      return this.update(accessToken);
    } catch (error) {
      console.log("Access Token Error", error);
    }
  }
}
