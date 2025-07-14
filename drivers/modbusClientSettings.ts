import Utilities from './utilities';

const EMPTY_IP = '0.0.0.0';

export default class ModbusClientSettings{
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
        
        if(!Utilities.checkIp(this.host))
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
       return `${this.host}:${this.port}/${this.unitId}`;
    }
}