'use strict';

import Homey from 'homey';
import ModbusClient, { ModbusClientSettings } from './drivers/modbusclient';

const HOST_KEY = 'modbushost';
const PORT_KEY = 'modbusport';
const UNIT_KEY = 'modbusunitid';

module.exports = class MyApp extends Homey.App {
  clientSettings: ModbusClientSettings = ModbusClientSettings.Empty();

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Starting initialization of the Huawei Modbus TCP App.');

    //load all parts of the settings into the modbusclient settings to use
    this._loadSetting(HOST_KEY);
    this._loadSetting(PORT_KEY);
    this._loadSetting(UNIT_KEY);

    this.log('Loading settings complete');

    this.homey.settings.addListener('set', (key: string) => {
      this._loadSetting(key);
      this._initializeClient();
    });

    this.homey.settings.addListener('unset', (key: string) => {
      this._clearSetting(key);
      this._initializeClient();
    });

    this.log('Initializing client');
    this._initializeClient();

    this.log('The Huawei Modbus TCP App has been initialized');
  }

  async onUninit() {
    try {
      var client = ModbusClient.getInstance();
      client.teardown();
    }
    finally {
      this.clientSettings = ModbusClientSettings.Empty();
    }
  }

  private _initializeClient(){
    try {
      if(ModbusClient.hasValue()) {
        this.log('Disposing of previous client instance, probably after re-configuration.');

        var client = ModbusClient.getInstance();
        client.teardown();
      }
    }
    catch(error) {
      this.log(error);
    }

    if(this.clientSettings.isValid())
    {
      //start the client
      var _ = ModbusClient.getInstance(this.clientSettings);

      this.log('Modbus client has been initialized');
    }else{
      this.log('Modbus client has NOT been initialized because the settings were invalid');
    }
  }

  private _loadSetting(key: string){
    this.log(`Loading settings for key ${key}`);

    switch(key){
        case HOST_KEY:
          this.clientSettings.host = this.homey.settings.get(HOST_KEY);
          break;
        case PORT_KEY:
          this.clientSettings.port = this._toWholeNumber(this.homey.settings.get(PORT_KEY));
          break;
        case UNIT_KEY:
          this.clientSettings.unitId = this._toWholeNumber(this.homey.settings.get(UNIT_KEY));
          break;
      }
  }

  private _toWholeNumber(x: any): number{
    var result = Number(x);

    return result >= 0 ? Math.floor(result): Math.ceil(result);
  }

  private _clearSetting(key: string) {
    this.log(`Unloading settings for key ${key}`);

    switch(key){
        case HOST_KEY:
          this.clientSettings.host = '';
          break;
        case PORT_KEY:
          this.clientSettings.port = -1;
          break;
        case UNIT_KEY:
          this.clientSettings.unitId = -1;
          break;
      }
  }
}
