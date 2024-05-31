import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import {
    IHouseLocation,
    IHouseLocationCoords,
    IHousing,
} from '@prism/sql/gameSchema/Housing.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('gethouse')
        .setDescription('Zeige Hausdaten')
        .addStringOption((option) =>
            option.setName('spieler').setDescription('SteamID des Spielers').setRequired(true),
        ),
)
export class GetHouse extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,
            Config.Groups.PROD.BOT_DEV,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const player = interaction.options.getString('spieler', true);
        const vUser = await PlayerService.validatePlayer(player);
        if (!vUser) {
            await this.replyError(
                `Es konnte kein User mit der SteamID \`${player}\` gefunden werden!`,
            );
            return;
        }

        const [houses] = await GameDB.query<IHousing[]>(
            `SELECT * FROM player_houses WHERE identifier = ?`,
            [player],
        );

        if (houses.length === 0) {
            await this.replyError(
                `Es konnte kein Haus für den Spieler mit der SteamID \`${player}\` gefunden werden!`,
            );
            return;
        }

        const fields = [];
        for (const house of houses) {
            const [houseLocation] = await GameDB.query<IHouseLocation[]>(
                `SELECT * FROM houselocations WHERE houseID = ?`,
                [house.houseID],
            );
            if (houseLocation.length === 0) {
                fields.push({
                    name: `Haus \`${house.houseID}\``,
                    value: `**Besitzer:** ${house.identifier}\n**Haus:** Keine Location gefunden`,
                });
            }
            const location = houseLocation[0];
            const coords: IHouseLocationCoords = JSON.parse(location.coords ?? '{}');
            fields.push({
                name: `Haus \`${house.houseID}\``,
                value: `**Besitzer:** ${house.identifier}\n**Haus:** ${
                    location.label ?? location.name
                }\n**Preis:** ${location.price}\n**Coords:** \`${coords?.enter.x ?? ''} ${
                    coords?.enter.y ?? ''
                } ${coords?.enter.z ?? ''}\`\n**Keyholder:** \`${
                    house.keyholders ?? 'Keine Schlüsselbesitzer vorhanden'
                }\`\n**Garage vorhanden:** ${location.garage ? 'Ja' : 'Nein'}`,
            });
        }

        await this.replyWithEmbed({
            description: `Alle Häuser von \`${vUser.identifiers.steam}\` (${vUser.playerdata.fullname})`,
            fields,
        });
    }
}
