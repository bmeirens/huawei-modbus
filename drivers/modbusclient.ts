import * as Modbus from 'jsmodbus';
import net from 'net';
import Homey, { Device } from 'homey';
import ModbusClientSettings from './modbusClientSettings';
import Reading from './reading';
import RegisterEntry from './registerEntry';
import Constants from './constants';

const CALL_INTERVAL = 120_000;
const CONNECTION_TIMEOUT = 50;
const TCP_CONNECTION_TIMEOUT = 3500;
const DELAY_AFTER_CONNECTION_ESTABLISHED = 5000;
const DELAY_BETWEEN_REGISTER_READS = 250;
const STRING_TYPE = 'STRING'
const UINT16_TYPE = 'UINT16';
const UINT32_TYPE = 'UINT32';
const INT16_TYPE = 'INT16';
const INT32_TYPE = 'INT32';

class Registers
{
    inverterRegisters: Map<string, RegisterEntry> = new Map<string, RegisterEntry>([
        ['modelName', new RegisterEntry(30000, 15, STRING_TYPE, 'Model Name', '')],
        [Constants.serialNumber, new RegisterEntry(30015, 10, STRING_TYPE, 'Serial Number', '')],
        ['pvStringsCount', new RegisterEntry(30071, 1, UINT16_TYPE, 'Number of PV Strings', '')],
        ['ratedPower', new RegisterEntry(30073, 2, UINT32_TYPE, 'Rated Power', 'kW', 1000)],
        ['pv1Voltage', new RegisterEntry(32016, 1, INT16_TYPE, 'PV1 Voltage', 'V', 10)],
        ['pv1Current', new RegisterEntry(32017, 1, INT16_TYPE, 'PV1 Current', 'A', 100)],
        ['pv2Voltage', new RegisterEntry(32018, 1, INT16_TYPE, 'PV2 Voltage', 'V', 10)],
        ['pv2Current', new RegisterEntry(32019, 1, INT16_TYPE, 'PV2 Current', 'A', 100)],
        ['dcPower', new RegisterEntry(32064, 2, INT32_TYPE, 'DC Power', 'kW', 1000)],
        ['gridVoltage', new RegisterEntry(32066, 1, UINT16_TYPE, 'Grid Voltage', 'V', 10)],
        ['gridVoltagePhaseA', new RegisterEntry(32069, 1, UINT16_TYPE, 'Grid Phase A Voltage', 'V', 10)],
        ['gridVoltagePhaseB', new RegisterEntry(32070, 1, UINT16_TYPE, 'Grid Phase B Voltage', 'V', 10)],
        ['gridVoltagePhaseC', new RegisterEntry(32071, 1, UINT16_TYPE, 'Grid Phase C Voltage', 'V', 10)],
        ['gridCurrentPhaseA', new RegisterEntry(32072, 2, INT32_TYPE, 'Grid Phase A Current', 'A', 1000)],
        ['gridCurrentPhaseB', new RegisterEntry(32074, 2, INT32_TYPE, 'Grid Phase B Current', 'A', 1000)],
        ['gridCurrentPhaseC', new RegisterEntry(32076, 2, INT32_TYPE, 'Grid Phase C Current', 'A', 1000)],
        ['activePowerPeakDay', new RegisterEntry(32078, 2, INT32_TYPE, 'Current Day Active Power Peak', 'kW', 1000)],
        ['activePower', new RegisterEntry(32080, 2, INT32_TYPE, 'Active Power', 'kW', 1000)],
        ['gridFrequency', new RegisterEntry(32085, 1, UINT16_TYPE, 'Grid Frequency', 'Hz', 100)],
        ['internalTemperature', new RegisterEntry(32087, 1, INT16_TYPE, 'Internal Temperature', '°C', 10)],
        ['deviceStatus', new RegisterEntry(32089, 1, INT16_TYPE, 'Device Status', '')],
        ['totalPowerGenerated', new RegisterEntry(32106, 2, UINT32_TYPE, 'Total Power Generated', 'kWh', 100)],
        ['currentHourPowerGenerated', new RegisterEntry(32112, 2, UINT32_TYPE, 'Power Generated This Hour', 'kWh', 100)],
        ['currentDayPowerGenerated', new RegisterEntry(32114, 2, UINT32_TYPE, 'Power Generated Today', 'kWh', 100)],
        ['previousHourPowerGenerated', new RegisterEntry(32158, 2, UINT32_TYPE, 'Power Generated Previous Hour', 'kWh', 100)],
        ['previousDayPowerGenerated', new RegisterEntry(32162, 2, UINT32_TYPE, 'Power Generated Yesterday', 'kWh', 100)],
    ]);

    batteryRegisters : Map<string, RegisterEntry> = new Map<string, RegisterEntry>([
        ['ratedCapacity', new RegisterEntry(37758, 2, UINT32_TYPE, 'Rated Capacity', 'Wh')],
        ['batterySOC', new RegisterEntry(37760, 1, UINT16_TYPE, 'Battery SOC', '%', 10)],
        ['deviceStatus', new RegisterEntry(37762, 1, UINT16_TYPE, 'Device Status', '')],//0 offline, 1 standby, 2 running, 3 fault, 4 sleep
        ['busVoltage', new RegisterEntry(37763, 1, UINT16_TYPE, 'Bus Voltage', 'V', 10)],
        ['busCurrent', new RegisterEntry(37764, 1, INT16_TYPE, 'Bus Current', 'A', 10)],
        ['chargeDischargePower', new RegisterEntry(37765, 2, INT32_TYPE, 'Charge / Discharge Power', 'W')],
        ['totalCharge', new RegisterEntry(37780, 2, UINT32_TYPE, 'Total Charge', 'kWh', 100)],
        ['totalDischarge', new RegisterEntry(37782, 2, UINT32_TYPE, 'Total Discharge', 'kWh', 100)],
        ['currentDayCharged', new RegisterEntry(37784, 2, UINT32_TYPE, 'Charged Today', 'kWh', 100)],
        ['currentDayDischarged', new RegisterEntry(37786, 2, UINT32_TYPE, 'Discharged Today', 'kWh', 100)],
        ['maximumChargePower', new RegisterEntry(37046, 2, UINT32_TYPE, 'Maximum Charge Power', 'W')],
        ['maximumDischargePower', new RegisterEntry(37048, 2, UINT32_TYPE, 'Maximum Discharge Power', 'W')],        
    ]);

    meterRegisters: Map<string, RegisterEntry> = new Map<string, RegisterEntry>([
        ['gridVoltagePhaseA', new RegisterEntry(37101, 2, INT32_TYPE, 'Grid Phase A Voltage', 'V', 10)],
        ['gridVoltagePhaseB', new RegisterEntry(37103, 2, INT32_TYPE, 'Grid Phase B Voltage', 'V', 10)],
        ['gridVoltagePhaseC', new RegisterEntry(37105, 2, INT32_TYPE, 'Grid Phase C Voltage', 'V', 10)],
        ['gridCurrentPhaseA', new RegisterEntry(37107, 2, INT32_TYPE, 'Grid Phase A Current', 'A', 100)],
        ['gridCurrentPhaseB', new RegisterEntry(37109, 2, INT32_TYPE, 'Grid Phase B Current', 'A', 100)],
        ['gridCurrentPhaseC', new RegisterEntry(37111, 2, INT32_TYPE, 'Grid Phase C Current', 'A', 100)],
        ['activePower', new RegisterEntry(37113, 2, INT32_TYPE, 'Active Power', 'W')],//positive to grid ; negative from grid
        ['gridFrequency', new RegisterEntry(37118, 1, INT16_TYPE, 'Grid Frequency', 'Hz', 100)],
        ['gridExportedEnergy', new RegisterEntry(37119, 2, INT32_TYPE, 'Grid Exported Energy', 'kWh', 100)],
        ['gridImportedEnergy', new RegisterEntry(37121, 2, INT32_TYPE, 'Grid Imported Energy', 'kWh', 100)],
        ['activePowerPhaseA', new RegisterEntry(37132, 2, INT32_TYPE, 'Grid Phase A Active Power', 'W')],
        ['activePowerPhaseB', new RegisterEntry(37134, 2, INT32_TYPE, 'Grid Phase B Active Power', 'W')],
        ['activePowerPhaseC', new RegisterEntry(37136, 2, INT32_TYPE, 'Grid Phase C Active Power', 'W')]
    ]);
}

export default class ModbusClient{
  timer!: NodeJS.Timeout;
  settings: ModbusClientSettings;
  registers: Registers;
  readings!: Map<string, Map<string, Reading>>;

    private static _instances = new Map<string, ModbusClient>();

    private constructor(settings: ModbusClientSettings) {
        // Private constructor to prevent direct instances
        this.settings = settings;
        this.registers = new Registers();

        this.timer = setInterval(() => {
            // poll state from modbus
            this._poll().then((value) => {this.readings = value;});
        }, CALL_INTERVAL);

        this._poll().then((value) => { this.readings = value;});
    }

    public static async canConnect(settings: ModbusClientSettings) : Promise<boolean> {
        if(!settings.isValid())
            return false;

        var modbusOptions = ModbusClient._createConnectionOptions(settings, 'Huawei Modbus Client');

        const socket = new net.Socket();
        const unitID = settings.unitId;

        console.log('Testing connection...');
        
        socket.setKeepAlive(false);
        socket.connect(modbusOptions);

        socket.on('connect', async () => {
            console.log('Connection test succeeded');

            socket.end();

            return true;
        });

        socket.on('timeout', async () => {
            console.log('socket timed out');

            socket.end();
        });

        socket.on('error', async (err) => {
            console.log('connection error');
            console.log(err);

            socket.end();
        });

        return false;
    }

    public static getInstance(settings: ModbusClientSettings): ModbusClient {
        const clientKey = settings.toClientKey();

        if(!ModbusClient._instances.has(clientKey))
        {
            if(!settings.isValid())
                throw new Error("ModbusClient getInstance was called with invalid or empty settings while no instance was created yet.");

            ModbusClient._instances.set(clientKey, new ModbusClient(settings));
        }

        var result = ModbusClient._instances.get(clientKey);

        if (result === undefined) {
            throw new Error(`No client instance registered for key ${clientKey}`);
        }

        return result;
    }

    public static disposeInstances(){
        ModbusClient._instances.forEach(
            (v: ModbusClient, k: string, m: Map<string, ModbusClient>) => { 
                console.log(`Tearing down instance with key ${k}`);
                v.teardown();
                m.delete(k);
            });
    }

    public getRegisters(section: string): Map<string, Reading> {
        console.log(`Retrival of registers for section ${section}`);

        if(this.readings !== undefined && this.readings.has(section))
        {
            return this.readings.get(section)!;
        }

        return new Map<string, Reading>();
    }

    private static _createConnectionOptions(settings: ModbusClientSettings, label: string) {
        const modbusOptions = {
            host: settings.host,
            port: settings.port,
            unitId: settings.unitId,
            timeout: CONNECTION_TIMEOUT,
            autoReconnect: false,
            logLabel: label,
            logLevel: 'error',
            logEnabled: true,
        };

        return modbusOptions;
    }

    private async _poll(): Promise<Map<string, Map<string, Reading>>>{
        console.log('polling....');

        var pollResult = await new Promise<Map<string, Map<string, Reading>>>((resolve, reject) => {

            var modbusOptions = ModbusClient._createConnectionOptions(this.settings, 'Huawei Modbus Client');

            const socket = new net.Socket();
            const unitID = this.settings.unitId;
            const client = new Modbus.client.TCP(socket, unitID, TCP_CONNECTION_TIMEOUT);
            
            socket.setKeepAlive(false);
            socket.connect(modbusOptions);

            socket.on('connect', async () => {
                console.log('Connected ...');

                let result = new Map<string, Map<string, Reading>>();

                console.log(modbusOptions);
                const startTime = new Date();

                await this._delay(DELAY_AFTER_CONNECTION_ESTABLISHED);

                //get all values for inverter, battery and meter
                var inverterReadings = await this._checkRegisters(this.registers.inverterRegisters, client);
                var meterReadings = await this._checkRegisters(this.registers.meterRegisters, client);
                var batteryReadings = await this._checkRegisters(this.registers.batteryRegisters, client);

                //set any result collections
                result.set(Constants.inverterReadingsKey, inverterReadings);
                result.set(Constants.meterReadingsKey, meterReadings);
                result.set(Constants.batteryReadingsKey, batteryReadings);

                console.log('disconnect');

                client.socket.end();
                socket.end();
                const endTime = new Date();
                const timeDiff = endTime.getTime() - startTime.getTime();
                const seconds = Math.floor(timeDiff / 1000);

                console.log(`total time spent: ${seconds} seconds`);

                resolve(result);
            });

            socket.on('close', () => {
                console.log('Client closed');
            });

            socket.on('timeout', () => {
                console.log('socket timed out');

                client.socket.end();
                socket.end();

                reject('socket timed out');
            });

            socket.on('error', (err) => {
                console.log('connection error');
                console.log(err);

                client.socket.end();
                socket.end();

                reject('connection error');
            });
        });

        return pollResult;
    }

    teardown(){
        console.log('Teardown of ModbusClient');
        
        if(this.timer)
        {
            clearInterval(this.timer);
        }
    }

    private _delay(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async _checkRegisters(registers: Map<string, RegisterEntry>, client: InstanceType<typeof Modbus.client.TCP>): Promise<Map<string, Reading>>{
        let result = new Map<string, Reading>();

        registers.forEach(async (entry: RegisterEntry, key: string) => {
            await this._delay(DELAY_BETWEEN_REGISTER_READS);

            try {
                console.log(`Fetching ${key} with start ${entry.start} and length ${entry.length}`);
                const res = client.readHoldingRegisters(entry.start, entry.length);
                const actualRes = await res;
                const { response } = actualRes;

                let resultValue: string = 'xxx';

                switch (entry.type) {
                    case UINT16_TYPE:
                        resultValue = response.body.valuesAsBuffer.readInt16BE().toString();
                    break;
                    case UINT32_TYPE:
                        resultValue = response.body.valuesAsBuffer.readUInt32BE().toString()
                    break;
                    case STRING_TYPE:
                        resultValue = response.body.valuesAsBuffer.toString();
                    break;
                    case INT16_TYPE:
                        resultValue = response.body.valuesAsBuffer.readInt16BE().toString();
                    break;
                    case INT32_TYPE:
                        resultValue = response.body.valuesAsBuffer.readInt32BE().toString();
                    break;
                    default:
                        console.log(`${key}: type not found ${entry.type}`);
                    break;
                }

                var reading = Reading.FromEntry(entry);

                //console.log(response.body);
                if(resultValue && resultValue !== undefined && resultValue !== 'xxx')
                {
                    reading.updateMeasurement(resultValue);
                    console.log(`${key} measurement is ${reading.formattedValue()}`);
                }

                result.set(key, reading);

            } catch (err) {
                console.log(`error with key: ${key}`);
                console.log(err);
            }
        });

        return result;
    }
}