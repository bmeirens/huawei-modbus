'use strict';

import Homey from 'homey';

module.exports = class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    const modbusHost = this.homey.settings.get('modbushost');
    const modbusPort = this.homey.settings.get('modbusport');
    const modbusUnitId = this.homey.settings.get('modbusunitid');

    this.log('Huawei Modbus TCP has been initialized');
  }

}
