import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BackupService } from '@prism/services/BackupService';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('testcommand')
        .setDescription('Test Command')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to get information about')
                .setRequired(true),
        ),
)
export class TestCommand extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV, Config.Groups.DEV.BOTTEST];
        this.DoNotLog = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await BackupService.backupUser('steam:1100001037c4109');
        await this.replyWithEmbed({
            description: `**test**`,
        });
    }
}
