import Homey from 'homey';
import ModbusClient from '../modbusClient';
import ModbusClientSettings from '../modbusClientSettings';
import Utilities from '../utilities';
import Constants from '../constants';

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
  // async onPairListDevices() {
  //   //get the first sample of data from modbus to make sure we can actually connect...
  //   //We'll try to map inverter properties
  //   //if this fails, we should return an empty collection

  //   var deviceId = Math.random().toString(36).substring(2, 5).toLowerCase();
  //   return [
  //      {
  //        name: 'Inverter',
  //        data: {
  //          id: deviceId,
  //        }
  //      }
  //   ];
  // }

  async onPair(session: Homey.Driver.PairSession): Promise<void> {
    let myHomey = this.homey;
    let me = this;
    session.setHandler("test_connection", async function (data) {
        // data is { 'host': '[ip]', 'port': [port], 'unitId': [unitId] }

        //create client settings, validate them
        var clientSettings = new ModbusClientSettings(data.host, Utilities.toWholeNumber(data.port), Utilities.toWholeNumber(data.unitId));

        if(!clientSettings.isValid())
        {
          console.log('Invalid settings');
          return { success : false, error: myHomey.__('pair.error_invalidSettings') };
        }

        var canConnect = await ModbusClient.canConnect(clientSettings);

        if(!canConnect)
        {
          console.log('Connection error');
          return { success: false, error: myHomey.__('pair.error_connectionFailed')};
        }
      
      //Attempt to read the registers at that address
      var client = ModbusClient.getInstance(clientSettings);

      var registers = client.getRegisters(Constants.inverterReadingsKey);

      if(!registers.has(Constants.serialNumber))
      {
        return { success: false, error: myHomey.__('pair.error_noSerial')};
      }

      var serial = registers.get(Constants.serialNumber);

      //Extract the serial number as the identifier for the device
      return {
        success: true, 
        deviceId: serial, 
        deviceSettings: {modbushost: data.host, modbusport: data.port, modbusunitid: data.unitId}
      };
    });
  }
};
