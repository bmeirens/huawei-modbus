export default class RegisterEntry {
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
    factor: number;
};