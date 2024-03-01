import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { IHouseLocation, IHouseLocationCoords, IHousing } from '@sql/schema/Housing.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * @description Klasse zum Anzeigen von Hausdaten
 * @author sirjxsh
 * @date 06.02.2024
 * @export
 * @class GetHouse
 * @extends {Command}
 */
export class GetHouse extends Command {
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

            Config.Groups.DEV.BOTTEST,
            Config.Groups.PROD.BOT_DEV,
        ];
        initCommandOld(
            new SlashCommandBuilder()
                .setName('gethouse')
                .setDescription('Zeige Hausdaten')
                .addStringOption((option) =>
                    option
                        .setName('spieler')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
            this,
        );
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
