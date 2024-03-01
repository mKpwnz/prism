import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { UserService } from '@services/UserService';
import { ISchufaUser } from '@sql/schema/User.schema';
import { SlashCommandBuilder } from 'discord.js';

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
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
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
        initCommandOld(
            new SlashCommandBuilder()
                .setName('schufacheck')
                .setDescription('Prüfe nach Hausbesitzern mit negativem Kontostand'),
            this,
        );
    }

    async execute(): Promise<void> {
        const schufaUsers: ISchufaUser[] = await UserService.getSchufaHouseOwners();

        await this.replyWithEmbed({
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
