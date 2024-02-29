export default class TxAdminError extends Error {
    constructor(public message: string = '') {
        super(message);
        this.name = 'TxAdminError';
        this.stack = (<any>new Error()).stack;
    }
}
