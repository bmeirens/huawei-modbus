import RegisterEntry from './registerEntry';

export default class Reading {
    public static FromEntry(input: RegisterEntry): Reading
    {
        return new Reading(input.label, input.unit, input.factor);
    };

    private constructor(label: string, unit: string, factor?: number){
        this.label = label;
        this.unit = unit;
        this.factor = factor ?? 1;
    }
    
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

    public hasValue(): boolean {
        return this.value !== undefined;
    }

    label: string;
    unit: string;
    value!: string;
    factor: number;
};