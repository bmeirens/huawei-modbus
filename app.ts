'use strict';

import Homey from 'homey';
import ModbusClient from './drivers/modbusClient';

module.exports = class MyApp extends Homey.App {

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
