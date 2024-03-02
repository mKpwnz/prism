import ErrorTemplate from './ErrorTemplate';

export default class TxAdminError extends ErrorTemplate {
    constructor(public message: string = '') {
        super(message);
    }
}

