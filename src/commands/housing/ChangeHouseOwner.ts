import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { IHousing } from '@prism/sql/gameSchema/Housing.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('changehouseowner')
        .setDescription('Ändere den Hausbesitzer')
        .addStringOption((option) =>
            option.setName('houseid').setDescription('ID des Hauses').setRequired(true),
        )
        .addStringOption((option) =>
            option.setName('newowner').setDescription('Neuer Besitzer').setRequired(true),
        ),
)
export class ChangeHouseOwner extends Command {
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

            Config.Groups.DEV.BOTTEST,
            Config.Groups.PROD.BOT_DEV,
        ];
        this.AllowedUsers = [Config.Users.FABI, Config.Users.KREAAMZY, Config.Users.SKY];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const houseId = interaction.options.getString('houseid', true);
        const newOwner = interaction.options.getString('newowner', true);

        const vUser = await PlayerService.validatePlayer(newOwner);
        if (!vUser) {
            await this.replyError(
                `Es konnte kein User mit der SteamID \`${newOwner}\` gefunden werden!`,
            );
            return;
        }

        const [house] = await GameDB.query<IHousing[]>(
            `SELECT * FROM player_houses WHERE houseID = ?`,
            [houseId],
        );

        if (house.length === 0) {
            await this.replyError(`Es konnte kein Haus mit der ID \`${houseId}\` gefunden werden!`);
            return;
        }

        const [updateHouse] = await GameDB.query<ResultSetHeader>(
            `UPDATE player_houses SET identifier = ?, keyholders = '[]' WHERE houseID = ?`,
            [newOwner, houseId],
        );

        if (updateHouse.affectedRows === 0) {
            await this.replyError(
                `Es ist ein Fehler aufgetreten. Das haus mit der ID \`${houseId}\` konnte nicht geändert werden.`,
            );
            return;
        }

        await this.replyWithEmbed({
            description: `Der Besitzer des Hauses mit der ID **${houseId}** wurde zu \`${vUser.identifiers.steam}\` (${vUser.playerdata.fullname}) geändert!`,
        });
    }
}
