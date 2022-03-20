const { ClientCredentials } = require('simple-oauth2');
const Https = require('https');
const request = require('request');

export class OauthToken {
  token: any;
  tokenExpireTime: number;
  lastAccessFailed: boolean;
  autoRefreshInterval: number;
  scope: number;

  constructor() {
    this.token = undefined;
    this.tokenExpireTime = this.getTime();
    this.lastAccessFailed = false;
    this.autoRefreshInterval = 5000;
  }

  getTime(addSeconds = 0) {
    return Math.trunc(new Date().getTime() / 1000 + addSeconds);
  }

  async getToken(scope) {
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

  update(accessToken) {
    if (accessToken) {
      this.token = accessToken.token.access_token;
      this.tokenExpireTime = this.getTime(accessToken.token.expires_in - 3); // -3 seconds buffer
      this.lastAccessFailed = false;
      return this.token;
    }
  }

  async autoRefreshToken(scope) {
    setInterval(async () => {
      await this.getToken(scope);
    }, this.autoRefreshInterval);
  }

  public getPCtoken() {
    const headers = {
      Authorization:
        'Basic NmNhMWJkNjMtZGIxNS00YWRlLWE3NmYtMTk2ZmIwOGZkNWI0OmQ4NGU5MGYzLTc0ZTMtNDg3OS1iNTRjLTUyZjdiMThkNzViMGNjNjU0ZmY1LTcwNTgtNDIwNS05MDYxLTJhNDk3OGRjOGQzYQ==',
    };
    return new Promise(function (resolve, reject) {
      request(
        {
          url: 'https://apigw-st.telus.com/st/token?grant_type=client_credentials&scope=363',
          proxy: 'http://198.161.14.25:8080',
          method: 'POST',
          agentOptions: {
            rejectUnauthorized: false,
          },
          headers: headers,
        },
        function (error, response, body) {
          if (error) {
            reject(error);
          } else {
            const responseBody = JSON.parse(response.body);
            resolve({ token: responseBody });
          }
        },
      );
    });
  }

  generateConfig(scope, client, secret) {
    return {
      method: 'POST',
      url: `https://apigw-pr.telus.com/token?grant_type=client_credentials&scope=${scope}`,
      agentOptions: {
        rejectUnauthorized: false,
      },
      proxy: 'http://198.161.14.25:8080',
      headers: {
        Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString(
          'base64',
        )}`,
        Cookie: 'PF=K7T37kQKfvoYvgCEA4Uvgo',
      },
    };
  }

  async getTokenByScope(scope) {
    const config =
      scope == 195
        ? this.generateConfig(
            scope,
            '3a87c8cb-552e-4d3d-aff3-0a4cc6c67511',
            'eee220d6-0df4-4964-96a9-4fd809f7b4e51c97b36d-5390-4ede-8a11-8c1f20cd91c7',
          )
        : this.generateConfig(
            scope,
            '816a3968-064a-4901-80b9-adf56e73d632',
            '09099e66-00ef-4e56-88eb-4b0468dbcce8d19ce6c2-9153-4f1c-b553-01906bbb218d',
          );
    return new Promise((resolve, reject) => {
      request(config, (error, response) => {
        if (error) {
          console.log('Token error', error);
          reject(error);
        } else {
          const responseBody = JSON.parse(response.body);
          console.log('Token', responseBody);
          resolve({ token: responseBody });
        }
      });
    });
  }

  async requestToken(scope) {
    try {
      let accessToken: any;
      if (scope == 363) {
        accessToken = await this.getPCtoken();
      } else {
        accessToken = await this.getTokenByScope(scope);
      }
      console.log('Token');
      console.log(accessToken);
      return this.update(accessToken);
    } catch (error) {
      console.log('Access Token Error', error);
    }
  }
}
