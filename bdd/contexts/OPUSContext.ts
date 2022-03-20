import { Identificators } from "./Identificators";

export default class OPUSContext {
  public identificator = Identificators.OPUSContext;
  private _ecid: string = "";
  private _address: Map<string, string> = new Map();
  private _iptv_id: string = "";
  private _offeringId: string = "";
  private _data: any;

  public get ecid(): string {
    return this._ecid;
  }
  public set ecid(id: string) {
    this._ecid = id;
  }

  public get data() {
    return this._data;
  }
  public set data(data) {
    this._data = data;
  }

  public get iptv_id(): string {
    return this._iptv_id;
  }
  public set iptv_id(id: string) {
    this._iptv_id = id;
  }

  public getAddress(key: string): string | undefined {
    return this._address.get(key);
  }
  public setAddress(key: string, value: string) {
    this._address.set(key, value);
  }

  public get offeringId(): string {
    return this._offeringId;
  }

  public set offeringId(id: string) {
    this._offeringId = id;
  }

  public getOPUSdata(): { [key: string]: string } {
    let address: { [key: string]: string } = {};
    for (const [key, value] of this._address) address[key] = value;
    return {
      ecid: this._ecid,
      offering_key: this._offeringId,
    };
  }
}
