import Command from '@prism/class/Command';
import Config from '@prism/Config';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { PhoneDarkchatService } from '@prism/services/PhoneDarkchatService';
import { PhoneService } from '@prism/services/PhoneService';
import { PlayerService } from '@prism/services/PlayerService';
import { executeCommandFromMap } from '@prism/utils/DiscordCommandHelper';
import { paginateApiResponse } from '@prism/utils/DiscordHelper';
import { validatePhoneMediaUrl } from '@prism/utils/FiveMHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('phone')
        .setDescription('Phone Commands')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('checkmedia')
                .setDescription('Check who created an Ingame image')
                .addStringOption((option) =>
                    option.setName('mediaurl').setDescription('Image/Video URL').setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('getpin')
                .setDescription('Gibt den aktuellen Handy Pin des Spielers aus')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
        )

        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('darkchat')
                .setDescription('Darkchat Commands')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('getmessages')
                        .setDescription('Nachrichten aus dem Darkchat abrufen')
                        .addStringOption((option) =>
                            option
                                .setName('filterby')
                                .setDescription('Filter Nach')
                                .addChoices(
                                    { name: 'Channel', value: 'byChannel' },
                                    { name: 'SteamID', value: 'bySteamID' },
                                    { name: 'Telefonnummer', value: 'byPhoneNumber' },
                                    { name: 'Darkchat Username', value: 'byDarkchatName' },
                                )
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('filtervalue')
                                .setDescription('Filter Wert')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option.setName('von').setDescription('Format: YYYY-MM-DD'),
                        )
                        .addStringOption((option) =>
                            option.setName('bis').setDescription('Format: YYYY-MM-DD'),
                        )
                        .addIntegerOption((option) =>
                            option.setName('page').setDescription('Seite'),
                        ),
                ),
        ),
)
export class Phone extends Command {
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
        if (!interaction.guildId) return;

        await executeCommandFromMap(interaction, {
            checkmedia: () => this.checkMediaCreator(interaction),
            getpin: () => this.getPhonePin(interaction),
            darkchat: {
                getmessages: () => this.getDarkchatMessages(interaction),
            },
        });
    }

    private async checkMediaCreator(interaction: ChatInputCommandInteraction): Promise<void> {
        const mediaUrl: string = interaction.options.getString('mediaurl', true);
        const normalizedLink = validatePhoneMediaUrl(mediaUrl);

        if (!normalizedLink) {
            await this.replyError(`Der link konnte nicht validiert werden.`);
            return;
        }

        const mediaCreator = await PhoneService.getMediaCreatorByLink(normalizedLink);

        if (!mediaCreator) {
            await this.replyWithEmbed({
                description: `Es konnte kein Spieler mit diesem Bild/Video gefunden werden.`,
            });
        }
        await this.replyWithEmbed({
            description: `\`\`\`json\n${JSON.stringify(mediaCreator, null, 4)}\`\`\``,
        });
    }

    private async getPhonePin(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);

        const vPlayer = await PlayerService.validatePlayer(steamID);

        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        const pin = await PhoneService.getCurrentPhonePin(vPlayer);

        if (pin instanceof Error) {
            await this.replyError(`Es ist ein Fehler aufgetreten: \`${pin.message}\``);
            return;
        }

        if (!pin) {
            await this.replyWithEmbed({
                description: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat keinen Handy pin gesetzt.`,
            });
            return;
        }

        await this.replyWithEmbed({
            description: `Der aktuelle Pin von **${vPlayer.playerdata.fullname}** (${steamID}) ist: **${pin}**`,
        });
    }

    private async getDarkchatMessages(interaction: ChatInputCommandInteraction): Promise<void> {
        const filterBy = interaction.options.getString('filterby', true);
        const filterValue = interaction.options.getString('filtervalue', true);
        const dateFrom = interaction.options.getString('von');
        const dateTo = interaction.options.getString('bis');
        const page = interaction.options.getInteger('page') ?? 1;

        const errorList: string[] = [];
        if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom))
            errorList.push('Das Format für das "von" Datum muss YYYY-MM-DD sein.');

        if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
            errorList.push('Das Format für das "bis" Datum muss YYYY-MM-DD sein.');

        if (errorList.length > 0) {
            await this.replyError(errorList.join('\n'));
            return;
        }

        const messages = await PhoneDarkchatService.getMessages(
            filterBy,
            filterValue,
            dateFrom,
            dateTo,
        );

        const pages = paginateApiResponse(
            messages,
            (message) => {
                const lines = [];
                lines.push(
                    `User: **${message.sender}** ( ${message.steamID} )\nChannel: **${
                        message.channel
                    }**\`\`\`${message.timestamp.toLocaleString('de-DE')}\n${message.content}\`\`\`\n`,
                );
                return lines.join('\n');
            },
            2000,
        );

        if (pages.length === 0) {
            await this.replyWithEmbed({
                description: `Keine Nachrichten gefunden.`,
            });
            return;
        }

        if (page > pages.length) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            description: pages[page - 1],
            title: `Darkchat Suche Seite ${page} von ${pages.length}`,
        });
    }
}
