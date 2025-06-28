import * as Modbus from 'jsmodbus';
import net from 'net';
import Homey, { Device } from 'homey';

const EMPTY_IP = '0.0.0.0';
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

class Entry{
    public constructor(start: number, length: number, type: string, label: string, unit: string, factor?: number){
        this.start = start;
        this.length = length;
        this.type = type;
        this.label = label;
        this.unit = unit;
        this.factor = factor ?? 1;
    }

    start: number;
    length: number;
    type: string;
    label: string;
    unit: string;
    value!: string;
    factor: number;

    public updateMeasurement(value: string)
    {
        this.value = value;
    }

    public formattedValue(): string
    {
        var defaultResult = `${this.value}${this.unit}`
        if(this.factor == 1) return defaultResult;

        var numericValue = Number(this.value);
        if(Number.isNaN(numericValue) || this.factor == 0)
        {
            return defaultResult;
        }

        var scaledValue = numericValue / this.factor;
        return `${scaledValue}${this.unit}`
    }
}

class Registers
{
    inverterRegisters: Object = {
        modelName: new Entry(30000, 15, STRING_TYPE, 'Model Name', ''),
        pvStringsCount: new Entry(30071, 1, UINT16_TYPE, 'Number of PV Strings', ''),
        ratedPower: new Entry(30073, 2, UINT32_TYPE, 'Rated Power', 'kW', 1000),
        pv1Voltage: new Entry(32016, 1, INT16_TYPE, 'PV1 Voltage', 'V', 10),
        pv1Current: new Entry(32017, 1, INT16_TYPE, 'PV1 Current', 'A', 100),
        pv2Voltage: new Entry(32018, 1, INT16_TYPE, 'PV2 Voltage', 'V', 10),
        pv2Current: new Entry(32019, 1, INT16_TYPE, 'PV2 Current', 'A', 100),
        dcPower: new Entry(32064, 2, INT32_TYPE, 'DC Power', 'kW', 1000),
        gridVoltage: new Entry(32066, 1, UINT16_TYPE, 'Grid Voltage', 'V', 10),
        gridVoltagePhaseA: new Entry(32069, 1, UINT16_TYPE, 'Grid Phase A Voltage', 'V', 10),
        gridVoltagePhaseB: new Entry(32070, 1, UINT16_TYPE, 'Grid Phase B Voltage', 'V', 10),
        gridVoltagePhaseC: new Entry(32071, 1, UINT16_TYPE, 'Grid Phase C Voltage', 'V', 10),
        gridCurrentPhaseA: new Entry(32072, 2, INT32_TYPE, 'Grid Phase A Current', 'A', 1000),
        gridCurrentPhaseB: new Entry(32074, 2, INT32_TYPE, 'Grid Phase B Current', 'A', 1000),
        gridCurrentPhaseC: new Entry(32076, 2, INT32_TYPE, 'Grid Phase C Current', 'A', 1000),
        activePowerPeakDay: new Entry(32078, 2, INT32_TYPE, 'Current Day Active Power Peak', 'kW', 1000),
        activePower: new Entry(32080, 2, INT32_TYPE, 'Active Power', 'kW', 1000),
        gridFrequency: new Entry(32085, 1, UINT16_TYPE, 'Grid Frequency', 'Hz', 100),
        internalTemperature: new Entry(32087, 1, INT16_TYPE, 'Internal Temperature', '°C', 10),
        deviceStatus: new Entry(32089, 1, INT16_TYPE, 'Device Status', ''),
        totalPowerGenerated: new Entry(32106, 2, UINT32_TYPE, 'Total Power Generated', 'kWh', 100),
        currentHourPowerGenerated: new Entry(32112, 2, UINT32_TYPE, 'Power Generated This Hour', 'kWh', 100),
        currentDayPowerGenerated: new Entry(32114, 2, UINT32_TYPE, 'Power Generated Today', 'kWh', 100),
        previousHourPowerGenerated: new Entry(32158, 2, UINT32_TYPE, 'Power Generated Previous Hour', 'kWh', 100),
        previousDayPowerGenerated: new Entry(32162, 2, UINT32_TYPE, 'Power Generated Yesterday', 'kWh', 100),
    };
    batteryRegisters : Object = {
        ratedCapacity: new Entry(37758, 2, UINT32_TYPE, 'Rated Capacity', 'Wh'),
        batterySOC: new Entry(37760, 1, UINT16_TYPE, 'Battery SOC', '%', 10),
        deviceStatus: new Entry(37762, 1, UINT16_TYPE, 'Device Status', ''),//0 offline, 1 standby, 2 running, 3 fault, 4 sleep
        busVoltage: new Entry(37763, 1, UINT16_TYPE, 'Bus Voltage', 'V', 10),
        busCurrent: new Entry(37764, 1, INT16_TYPE, 'Bus Current', 'A', 10),
        chargeDischargePower: new Entry(37765, 2, INT32_TYPE, 'Charge / Discharge Power', 'W'),
        totalCharge: new Entry(37780, 2, UINT32_TYPE, 'Total Charge', 'kWh', 100),
        totalDischarge: new Entry(37782, 2, UINT32_TYPE, 'Total Discharge', 'kWh', 100),
        currentDayCharged: new Entry(37784, 2, UINT32_TYPE, 'Charged Today', 'kWh', 100),
        currentDayDischarged: new Entry(37786, 2, UINT32_TYPE, 'Discharged Today', 'kWh', 100),
        maximumChargePower: new Entry(37046, 2, UINT32_TYPE, 'Maximum Charge Power', 'W'),
        maximumDischargePower: new Entry(37048, 2, UINT32_TYPE, 'Maximum Discharge Power', 'W'),        
    };
    meterRegisters: Object=  {
        gridVoltagePhaseA: new Entry(37101, 2, INT32_TYPE, 'Grid Phase A Voltage', 'V', 10),
        gridVoltagePhaseB: new Entry(37103, 2, INT32_TYPE, 'Grid Phase B Voltage', 'V', 10),
        gridVoltagePhaseC: new Entry(37105, 2, INT32_TYPE, 'Grid Phase C Voltage', 'V', 10),
        gridCurrentPhaseA: new Entry(37107, 2, INT32_TYPE, 'Grid Phase A Current', 'A', 100),
        gridCurrentPhaseB: new Entry(37109, 2, INT32_TYPE, 'Grid Phase B Current', 'A', 100),
        gridCurrentPhaseC: new Entry(37111, 2, INT32_TYPE, 'Grid Phase C Current', 'A', 100),
        activePower: new Entry(37113, 2, INT32_TYPE, 'Active Power', 'W'),//positive to grid ; negative from grid
        gridFrequency: new Entry(37118, 1, INT16_TYPE, 'Grid Frequency', 'Hz', 100),
        gridExportedEnergy: new Entry(37119, 2, INT32_TYPE, 'Grid Exported Energy', 'kWh', 100),
        gridImportedEnergy: new Entry(37121, 2, INT32_TYPE, 'Grid Imported Energy', 'kWh', 100),
        activePowerPhaseA: new Entry(37132, 2, INT32_TYPE, 'Grid Phase A Active Power', 'W'),
        activePowerPhaseB: new Entry(37134, 2, INT32_TYPE, 'Grid Phase B Active Power', 'W'),
        activePowerPhaseC: new Entry(37136, 2, INT32_TYPE, 'Grid Phase C Active Power', 'W')
    };
}

export class ModbusClientSettings{
    host: string;
    port: number;
    unitId: number;

    static Empty(): ModbusClientSettings{
        return new ModbusClientSettings(EMPTY_IP, 502, 1);
    }

    public constructor(host: string, port: number, unitId: number){
        this.host = host;
        this.port = port;
        this.unitId = unitId;
    }

    public isValid(): boolean {
        if(this.host == EMPTY_IP || this.host == '')
        {
            return false;
        }
        
        if(!this._checkIp(this.host))
        {
            return false;
        }

        if(this.port < 0)
            return false;

        if(this.unitId < 0 || this.unitId > 50)
            return false;

        return true;
    }

    public toClientKey() : string {
        return `${this.host}-${this.port}-${this.unitId}`;
    
    }

    private _checkIp(ip: string) : boolean {
        const ipv4 = 
            /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6 = 
            /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4.test(ip) || ipv6.test(ip);
    }
}

export default class ModbusClient{
  timer!: NodeJS.Timeout;
  settings: ModbusClientSettings;
  registers: Registers;

    private static _instance: ModbusClient | undefined;

    private constructor(settings: ModbusClientSettings) {
        // Private constructor to prevent direct instances
        this.settings = settings;
        this.registers = new Registers();

        this.timer = setInterval(() => {
            // poll state from modbus
            this._poll();
        }, CALL_INTERVAL);

        this._poll();
    }

    public static hasValue() : boolean {
        if(ModbusClient._instance)
            return true;
        
        return false;
    }

    public static getInstance(settings?: ModbusClientSettings): ModbusClient {
        if(!ModbusClient._instance)
        {
            if(!settings) 
                throw new Error("ModbusClient getInstance was called without settings while no instance was created yet.");

            if(!settings.isValid())
                throw new Error("ModbusClient getInstance was called with invalid or empty settings while no instance was created yet.");

            ModbusClient._instance = new ModbusClient(settings)
        }

        return ModbusClient._instance;
    }

    public getRegisters(section: string): string {
        console.log(`Retrival of registers for section ${section}`);
        return section;
    }

    private async _poll(): Promise<void>{
        console.log('polling....');

        const modbusOptions = {
            host: this.settings.host,
            port: this.settings.port,
            unitId: this.settings.unitId,
            timeout: CONNECTION_TIMEOUT,
            autoReconnect: false,
            logLabel: 'Huawei Inverter',
            logLevel: 'error',
            logEnabled: true,
        };

        const socket = new net.Socket();
        const unitID = this.settings.unitId;
        const client = new Modbus.client.TCP(socket, unitID, TCP_CONNECTION_TIMEOUT);
        
        socket.setKeepAlive(false);
        socket.connect(modbusOptions);

        socket.on('connect', async () => {
            console.log('Connected ...');

            console.log(modbusOptions);
            const startTime = new Date();

            await this._delay(DELAY_AFTER_CONNECTION_ESTABLISHED);

            //TODO: get all values for inverter, battery and meter
            await this._checkRegisters(this.registers.inverterRegisters, client);
            await this._checkRegisters(this.registers.meterRegisters, client);
            await this._checkRegisters(this.registers.batteryRegisters, client);

            console.log('disconnect');

            client.socket.end();
            socket.end();

            //TODO: pass the results onto any reactive observers as key value pairs [string, string]

            const endTime = new Date();
            const timeDiff = endTime.getTime() - startTime.getTime();
            const seconds = Math.floor(timeDiff / 1000);

            console.log(`total time spent: ${seconds} seconds`);
        });

        socket.on('close', () => {
            console.log('Client closed');
        });

        socket.on('timeout', () => {
            console.log('socket timed out');

            client.socket.end();
            socket.end();
        });

        socket.on('error', (err) => {
            console.log(err);

            client.socket.end();
            socket.end();
        });
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

    private async _checkRegisters(registers: Object, client: InstanceType<typeof Modbus.client.TCP>): Promise<void>{
        for (const [key, entry] of Object.entries(registers)) {
             
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

                //console.log(response.body);
                if(resultValue && resultValue !== undefined && resultValue !== 'xxx')
                {
                    entry.updateMeasurement(resultValue);
                    console.log(`${key} measurement is ${entry.formattedValue()}`);
                }
            } catch (err) {
                console.log(`error with key: ${key}`);
                console.log(err);
            }
        }
    }
}