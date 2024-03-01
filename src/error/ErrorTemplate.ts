export default class ErrorTemplate extends Error {
    public name: string = this.constructor.name;

    constructor(public message: string = '') {
        super(message);
        this.stack = (<any>new Error()).stack;
    }
}

