import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { ISchufaUser } from '@sql/schema/User.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { UserService } from '@services/UserService';

/**
 * @description Klasse zum Überprüfen von Hausbesitzern mit negativem Kontostand.
 * @author mKpwnz
 * @date 28.12.2023
 * @export
 * @class SchufaCheck
 * @extends {Command}
 */
export class SchufaCheck extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_UNLIMITED,
            Config.Channels.PROD.WHOIS_TESTI,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('schufacheck')
                .setDescription('Prüfe nach Hausbesitzern mit negativem Kontostand'),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const schufaUsers: ISchufaUser[] = await UserService.getSchufaUsers();

        for (const user of schufaUsers) {
            schufaUsers[schufaUsers.indexOf(user)].accounts = JSON.parse(user.accounts);
        }

        await this.replyWithEmbed({
            interaction,
            title: 'Schufa Check abgeschlossen',
            description: `**${
                schufaUsers.length
            }** Hausbesitzer mit negativem Kontostand gefunden.\`\`\`json\n${JSON.stringify(
                schufaUsers,
                null,
                4,
            )}\`\`\``,
        });
    }
}
