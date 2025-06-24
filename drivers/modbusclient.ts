import * as Modbus from 'jsmodbus';
import net from 'net';
import Homey, { Device } from 'homey';

const EMPTY_IP = '0.0.0.0';
const CALL_INTERVAL = 120_000;
const CONNECTION_TIMEOUT = 115;
const TCP_CONNECTION_TIMEOUT = 5500;
const DELAY_AFTER_CONNECTION_ESTABLISHED = 5000;

export interface Measurement {
  value: string;
  scale: string;
  label: string;
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

    public IsValid(): boolean {
        if(this.host == EMPTY_IP || this.host == '')
        {
            return false;
        }
        
        if(!this.checkIp(this.host))
        {
            return false;
        }

        if(this.port < 0)
            return false;

        if(this.unitId < 0 || this.unitId > 50)
            return false;

        return true;
    }

    private checkIp(ip: string) : boolean {
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

    private static instance: ModbusClient | undefined;

    private constructor(settings: ModbusClientSettings) {
        // Private constructor to prevent direct instances
        this.settings = settings;

        this.timer = setInterval(() => {
            // poll state from modbus
            this.poll();
        }, CALL_INTERVAL);

        this.poll();
    }

    public static HasValue() : boolean {
        if(ModbusClient.instance)
            return true;
        
        return false;
    }

    public static getInstance(settings?: ModbusClientSettings): ModbusClient {
        if(!ModbusClient.instance)
        {
            if(!settings) 
                throw new Error("ModbusClient getInstance was called without settings while no instance was created yet.");

            if(!settings.IsValid())
                throw new Error("ModbusClient getInstance was called with invalid or empty settings while no instance was created yet.");

            ModbusClient.instance = new ModbusClient(settings)
        }

        return ModbusClient.instance;
    }

    public Registers(section: string): string {
        console.log(`Retrival of registers for section ${section}`);
        return section;
    }

    private async poll(): Promise<void>{
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

            await this.delay(DELAY_AFTER_CONNECTION_ESTABLISHED);

            //TODO: call into the registers and get all values for inverter, battery and meter

            console.log('disconnect');

            client.socket.end();
            socket.end();

            //TODO: compile the results
            //TODO: process the results

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

    private delay(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}