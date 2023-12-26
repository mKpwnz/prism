import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import { ISchufaUser } from '@sql/schema/User.schema';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

// TODO: REFACTOR
export class SchufaCheck extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('schufacheck')
                .setDescription('Prüfe nach Hausbesitzern mit negativem Kontostand'),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const [schufaUsers] = await GameDB.query<ISchufaUser[]>(
                `SELECT firstname, lastname, steamId, accounts FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
            );
            for (const user of schufaUsers) {
                schufaUsers[schufaUsers.indexOf(user)].accounts = JSON.parse(user.accounts);
            }
            interaction.reply({
                content: `**${
                    schufaUsers.length
                }** Hausbesitzer mit negativem Kontostand gefunden.\`\`\`json\n${JSON.stringify(
                    schufaUsers,
                    null,
                    4,
                )}\`\`\``,
            });
        } catch (e) {
            LogManager.error(e);
            interaction.reply({
                content: `Fehler beim ausführen des Befeheles.`,
                ephemeral: true,
            });
        }
    }
}
