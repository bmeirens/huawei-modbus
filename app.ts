'use strict';

import Homey from 'homey';
//import ModbusClient, { ModbusClientSettings } from './drivers/modbusclient';
import ModbusClient from './drivers/modbusclient';

module.exports = class MyApp extends Homey.App {
  //clientSettings: ModbusClientSettings = ModbusClientSettings.Empty();

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Starting initialization of the Huawei Modbus TCP App.');

    this.log('The Huawei Modbus TCP App has been initialized');
  };

  async onUninit() {
    this.log('Disposing all ModbusClient instances');
    ModbusClient.disposeInstances();
  };
}
