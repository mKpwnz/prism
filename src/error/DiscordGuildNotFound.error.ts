import ErrorTemplate from './ErrorTemplate';

export default class DiscordGuildNotFoundError extends ErrorTemplate {
    constructor(public message: string = '') {
        super(message);
    }
}
