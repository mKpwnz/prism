export class Helper {
    static numberWithCommas(input: number): string {
        if (input.toString()) {
            return input.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, '.');
        }
        return input.toString();
    }

    static decimalToHexString(number: number): string {
        if (number < 0) {
            number = 0xffffffff + number + 1;
        }
        return number.toString(16);
    }

    static secondsToTimeString(seconds: number): string {
        const days = Math.floor(seconds / (3600 * 24));
        seconds -= days * 3600 * 24;
        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        const tmp = [];
        if (days) tmp.push(`${days}d`);
        if (days || hours) tmp.push(`${hours}h`);
        if (days || hours || minutes) tmp.push(`${minutes}m`);
        tmp.push(`${seconds}s`);
        return tmp.join(' ');
    }

    static getUniqueId(): string {
        const dateStr = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `${dateStr}-${randomStr}`;
    }

    static enumFromValue = <T extends Record<string, string>>(val: string, _enum: T) => {
        const enumName = (Object.keys(_enum) as Array<keyof T>).find((k) => _enum[k] === val);
        if (!enumName) throw Error();
        return _enum[enumName];
    };

    static validateDate(date: string): boolean {
        return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date);
    }

    static promiseTimeout(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
