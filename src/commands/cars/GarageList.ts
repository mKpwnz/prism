import Config from '@Config';
import { Command } from '@class/Command';
import GameserverClient from '@clients/GameserverClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { paginateApiResponse } from '@utils/DiscordHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class GarageList extends Command {
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

        RegisterCommand(
            new SlashCommandBuilder()
                .setName('garagelist')
                .setDescription('Gibt eine liste aller Garagen inc. IDs, Name und Coordinaten')
                .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const page = interaction.options.getInteger('page') ?? 1;
        const garages = await GameserverClient.getAllGarages();

        if (garages instanceof Error) {
            await this.replyError(garages.message);
            return;
        }

        const pages = paginateApiResponse(
            garages,
            (res) => {
                const lines = [];
                lines.push('```');
                lines.push(`ID: ${res.garageId}`);
                lines.push(`Name: ${res.DisplayName}`);
                lines.push(`Coords: ${res.Coordinates}`);
                lines.push(`Einparker: ${res.ParkInCoordinates.toString()}`);
                lines.push(`Ausparker: ${res.ParkOutCoordinates.toString()}`);
                lines.push('```');
                return lines.join('\n');
            },
            2000,
        );

        await this.replyWithEmbed({
            title: `Garagenliste ( Seite ${page} von ${pages.length} )`,
            description: pages[page - 1],
        });
    }
}
