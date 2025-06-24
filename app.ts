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
    this.loadSetting(HOST_KEY);
    this.loadSetting(PORT_KEY);
    this.loadSetting(UNIT_KEY);

    this.log('Loading settings complete');

    this.homey.settings.addListener('set', (key: string) => {
      this.loadSetting(key);
      this.initializeClient();
    });

    this.homey.settings.addListener('unset', (key: string) => {
      this.clearSetting(key);
      this.initializeClient();
    });

    this.log('Initializing client');
    this.initializeClient();

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

  private initializeClient(){
    try {
      if(ModbusClient.HasValue()) {
        this.log('Disposing of previous client instance, probably after re-configuration.');

        var client = ModbusClient.getInstance();
        client.teardown();
      }
    }
    catch(error) {
      this.log(error);
    }

    if(this.clientSettings.IsValid())
    {
      //start the client
      var _ = ModbusClient.getInstance(this.clientSettings);

      this.log('Modbus client has been initialized');
    }else{
      this.log('Modbus client has NOT been initialized because the settings were invalid');
    }
  }

  private loadSetting(key: string){
    this.log(`Loading settings for key ${key}`);

    switch(key){
        case HOST_KEY:
          this.clientSettings.host = this.homey.settings.get(HOST_KEY);
          break;
        case PORT_KEY:
          this.clientSettings.port = this.homey.settings.get(PORT_KEY);
          break;
        case UNIT_KEY:
          this.clientSettings.unitId = this.homey.settings.get(UNIT_KEY);
          break;
      }
  }

  private clearSetting(key: string) {
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
