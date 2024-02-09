import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { IHousing } from '@sql/schema/Housing.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

/**
 * @description Klasse zum Ändern von Hausbesitzern
 * @author sirjxsh
 * @date 06.02.2024
 * @export
 * @class ChangeHouseOwner
 * @extends {Command}
 */
export class ChangeHouseOwner extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_LIMITED,
            Config.Channels.PROD.WHOIS_TESTI,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.DEV.BOTTEST,
            Config.Groups.PROD.BOT_DEV,
        ];
        this.AllowedUsers = [Config.Users.FABI, Config.Users.KREAAMZY];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('changehouseowner')
                .setDescription('Ändere den Hausbesitzer')
                .addStringOption((option) =>
                    option.setName('houseid').setDescription('ID des Hauses').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('newowner').setDescription('Neuer Besitzer').setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const houseId = interaction.options.getString('houseid', true);
        const newOwner = interaction.options.getString('newowner', true);

        const vUser = await PlayerService.validatePlayer(newOwner);
        if (!vUser) {
            await interaction.reply({
                content: `Es konnte kein User mit dem Namen \`${newOwner}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        const [house] = await GameDB.query<IHousing[]>(
            `SELECT * FROM player_houses WHERE houseID = ?`,
            [houseId],
        );

        if (house.length === 0) {
            await interaction.reply({
                content: `Es konnte kein Haus mit der ID \`${houseId}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        const [updateHouse] = await GameDB.query<ResultSetHeader>(
            `UPDATE player_houses SET identifier = ?, keyholders = '[]' WHERE houseID = ?`,
            [newOwner, houseId],
        );

        if (updateHouse.affectedRows === 0) {
            await interaction.reply({
                content: `Es konnte kein Haus mit der ID \`${houseId}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        await this.replyWithEmbed({
            interaction,
            title: 'Hausbesitzer geändert',
            description: `Der Besitzer des Hauses mit der ID **${houseId}** wurde zu \`${vUser.identifiers.steam}\` (${vUser.playerdata.fullname}) geändert!`,
        });
    }
}
