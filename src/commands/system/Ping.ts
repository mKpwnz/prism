import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

@RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'))
export class Ping extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
    }

    async execute(): Promise<void> {
        console.log(this);
        await this.replyWithEmbed({ description: 'Pong!' });
    }
}
