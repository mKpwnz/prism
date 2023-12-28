export default class GuildNotFoundError extends Error {
    constructor(public message: string = '') {
        super(message);
        this.name = 'GuildNotFound';
        this.stack = (<any>new Error()).stack;
    }
}
