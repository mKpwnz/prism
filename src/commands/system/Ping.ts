import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

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
        initCommandOld(new SlashCommandBuilder().setName('ping').setDescription('Pong!'), this);
    }

    async execute(): Promise<void> {
        await this.replyWithEmbed({ description: 'Pong!' });
    }
}
