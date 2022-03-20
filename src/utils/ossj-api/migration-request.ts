import { promises as fs } from "fs";
import path from "path";
import * as queries from "../../db/dbQueries";
import { envConfig } from "../../env-config";
import { axiosInstance } from "../../axiosInstance";
const { postgresQueryExecutor } = require("@telus-bdd/telus-bdd");

export declare type MigrationRequestType = "PROVIDE" | "DISCONNECT";

export class MigrationRequest {
  public headers: { [key: string]: string };
  public requestBody: string;

  constructor() {
    this.headers = {};
    this.requestBody = "";
  }

  public async send( requestData: { [key: string]: string },type: MigrationRequestType) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await this.generateBody(requestData, type);
    await this.generateHeaders();
    // console.log(this.requestBody);
    // console.log(this.headers);
    try {
      const response = await axiosInstance({
        method: "post",
        url: envConfig.baseUrl,
        data: this.requestBody,
        headers: this.headers,
      });
      return response;
    } catch (err: any) {
      throw new Error(
        `Error while sending migration request: ${err.response.data}`
      );
    }
  }

  private static async getRequestTemplate(type: MigrationRequestType): Promise<string> {
    let templateName: string = "";
    console.log(type);
    if (type === "PROVIDE") templateName = envConfig.provideTemplate;
    console.log(templateName);
    const templatePath = path.resolve(process.cwd(), "assets", templateName);
    const template = (await fs.readFile(templatePath)).toString();
    return template;
  }

  public async generateBody(requestData: { [key: string]: any }, type: MigrationRequestType) {
    const now = new Date();
    requestData = {
      ...requestData,
      req_date: now.toISOString(),
    };
    this.requestBody = await MigrationRequest.getRequestTemplate(type);
    Object.keys(requestData).forEach((param) => {
      const replaceRegexp = new RegExp(`#${param.toUpperCase()}#`, "g");
      this.requestBody = this.requestBody.replace(
        replaceRegexp,
        requestData[param]
      );
    });
  }

  public generateHeaders() {
    this.headers["Content-Type"] = envConfig.contentType;
  }

  public async setMigrated(ecid: string, locationId: string) {
    const query = queries.setMigratedFlag(ecid, locationId);
    try {
      await postgresQueryExecutor(query);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async resetMigrating(ecid: string, locationId: string) {
    const query = queries.resetCustomerMigratingFlag(ecid, locationId);
    try {
      await postgresQueryExecutor(query);
    } catch (error: any) {
      throw new Error(error);
    }
  }

}
