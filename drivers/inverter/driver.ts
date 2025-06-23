import Homey from 'homey';

module.exports = class InverterDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('InverterDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    //get the first sample of data from modbus to make sure we can actually connect...
    //if this fails, we should have a way to not proceed
    var deviceId = Math.random().toString(36).substr(2, 5).toLowerCase();
    return [
       {
         name: 'Inverter',
         data: {
           id: deviceId,
         }
       }
    ];
  }
};
