import oracledb, { Connection } from "oracledb";
import { envConfig } from "../env-config";
oracledb.autoCommit = true;

class OracleDriver {
  private _config: { [key: string]: string };
  private _connection: Connection = <Connection>{};
  constructor() {
    this._config = envConfig;
  }
  public async connect() {
    try {
      this._connection = await oracledb.getConnection({
        user: envConfig.ncdb.user,
        password: envConfig.ncdb.password,
        connectString: envConfig.ncdb.connectString,
      });
    } catch (error) {
      throw new Error(`Error while connecting to database: ${error}`);
    }
  }
  public async closeConnection() {
    try {
      await this._connection.close();
    } catch (error) {
      throw new Error(`Error while disconnecting from database: ${error}`);
    }
  }
  public async executeQuery(query: string): Promise<any> {
    try {
      const result = await this._connection.execute(query);
      return result;
    } catch (error) {
      throw new Error(
        `Error while executing query:\n ${query} \nError: ${error}`
      );
    }
  }
}
const oracleDriver = new OracleDriver();
export default oracleDriver;
