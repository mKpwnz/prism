import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Ping extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;

        RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'), this);
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply('Pong!');
    }
}
