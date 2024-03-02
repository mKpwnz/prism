import ErrorTemplate from './ErrorTemplate';

export default class BotCommandNotValidError extends ErrorTemplate {
    constructor(public message: string = '') {
        super(message);
    }
}

