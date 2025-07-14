export default class Utilities {
    public static  toWholeNumber(x: any): number{
    var result = Number(x);

    return result >= 0 ? Math.floor(result): Math.ceil(result);
  };

  public static checkIp(ip: string) : boolean {
        const ipv4 = 
            /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6 = 
            /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4.test(ip) || ipv6.test(ip);
    }
};