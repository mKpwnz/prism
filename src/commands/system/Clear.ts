import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the chat.')
        .addIntegerOption((option) =>
            option
                .setName('count')
                .setDescription('Anzahl an Nachrichten')
                .setRequired(true)
                .setMaxValue(100),
        ),
)
export class Clear extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.STAGING;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const msgCount = interaction.options.getInteger('count', true);

        if (
            interaction.channel &&
            interaction.channel.isTextBased() &&
            !interaction.channel.isDMBased()
        ) {
            const messages = await interaction.channel.messages.fetch({ limit: msgCount });
            await interaction.channel.bulkDelete(messages);
            await this.replyWithEmbed({ description: `Deleted ${msgCount} messages.` });
        } else {
            await this.replyError('Dieser Command kann hier nicht genutzt werden.');
        }
    }
}

