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
import { EmbedFieldSpacer, IEmbedField } from '@prism/typings/interfaces/IEmbed';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';

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
                .setName('info')
                .setDescription('Phone Info by User')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('currentlogins')
                .setDescription('See Current Account Logins by Player')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('savedlocations')
                .setDescription('Saved Locations by the User')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('notes')
                .setDescription('Saved Locations by the User')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                )
                .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('callhistory')
                .setDescription('Call history for the User')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                )
                .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
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
            info: () => this.getPhoneInfo(interaction),
            currentlogins: () => this.getCurrentLogins(interaction),
            savedlocations: () => this.getSavedLocations(interaction),
            notes: () => this.getNotes(interaction),
            callhistory: () => this.getCallHistory(interaction),
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

    private async getPhoneInfo(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const fields: IEmbedField[] = [];
        fields.push({
            name: 'SteamID',
            value: `${vPlayer.identifiers.steam}`,
            inline: true,
        });
        fields.push(EmbedFieldSpacer);
        fields.push({
            name: 'Telefonnummer',
            value: `${phone.phone_number}`,
            inline: true,
        });
        fields.push({
            name: 'Pin',
            value: phone.pin ? phone.pin : 'Kein Pin gesetzt',
            inline: true,
        });
        fields.push(EmbedFieldSpacer);
        fields.push({
            name: 'Einrichtung abgeschlossen',
            value: phone.is_setup ? 'Ja' : 'Nein',
            inline: true,
        });

        if (phone.settings) {
            const settings = JSON.parse(phone.settings);
            const installierteApps: string[] = [];
            if (settings.apps) {
                settings.apps.forEach((ar1: string[]) => {
                    ar1.forEach((app: string) => {
                        installierteApps.push(app);
                    });
                });
            }
            fields.push({
                name: 'Installierte Apps',
                value: `\`\`\`\n${installierteApps.sort().join('\n')}\`\`\``,
            });
        }
        await this.replyWithEmbed({
            title: `Handy Informationen: ${vPlayer.playerdata.fullname}`,
            description: ` `,
            fields,
        });
    }

    private async getCurrentLogins(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const phoneData = await PhoneService.getPhoneDataByPhone(phone, { currentSessions: true });

        let description = `Der user ist aktuell in keinen Account eingeloggt`;
        if (phoneData.currentSessions.length > 0) {
            const table = new AsciiTable3('Aktive Logins')
                .setStyle('unicode-single')
                .setHeading('App', 'Username')
                .setAlign(1, AlignmentEnum.LEFT)
                .setAlign(2, AlignmentEnum.LEFT);
            phoneData.currentSessions.forEach((session) => {
                table.addRow(session.app, session.username);
            });
            description = `\`\`\`\n${table.toString()}\`\`\``;
        }

        await this.replyWithEmbed({
            title: `Aktive Logins von: ${vPlayer.playerdata.fullname}`,
            description,
        });
    }

    private async getSavedLocations(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const phoneData = await PhoneService.getPhoneDataByPhone(phone, { savedLocations: true });

        let description = `Der user hat keine Positionen gespeichert.`;
        if (phoneData.savedLocations.length > 0) {
            const positions: string[] = [];
            phoneData.savedLocations.forEach((location) => {
                positions.push(
                    `**${location.name}**\`\`\`\nX: ${location.x_pos}\nY: ${location.y_pos}\`\`\``,
                );
            });
            description = positions.join('\n');
        }

        await this.replyWithEmbed({
            title: `Gespeicherte Positionen von: ${vPlayer.playerdata.fullname}`,
            description,
        });
    }

    private async getNotes(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const page = interaction.options.getInteger('page') ?? 1;
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const phoneData = await PhoneService.getPhoneDataByPhone(phone, { notes: true });

        const pages = paginateApiResponse(
            phoneData.notes,
            (note) => {
                const lines = [];
                let content = note.content ?? 'Kein Inhalt';
                if (content.length > 1500) {
                    content = `${content.substring(0, 1500)}...`;
                }
                lines.push(`Titel: **${note.title}**`);
                lines.push(`Datum: **${note.timestamp.toLocaleString('de-DE')}**`);
                lines.push(`\`\`\`\n${content}\`\`\`\n`);
                return lines.join('\n');
            },
            2000,
        );

        if (pages.length === 0) {
            await this.replyWithEmbed({
                description: `Der user hat keine Notizen gespeichert.`,
            });
            return;
        }

        if (page > pages.length) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            description: pages[page - 1],
            title: `Notizen von: ${vPlayer.playerdata.fullname} | Seite ${page} von ${pages.length}`,
        });
    }

    private async getCallHistory(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const page = interaction.options.getInteger('page') ?? 1;
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const phoneData = await PhoneService.getPhoneDataByPhone(phone, { callHistory: true });

        const pages = paginateApiResponse(
            phoneData.callHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            (call) => {
                const lines = [];
                const isCaller = call.caller === phone.phone_number;
                lines.push(
                    isCaller
                        ? `Hat **${call.callee}** angerufen`
                        : `Wurde von **${call.caller}** angerufen`,
                );
                lines.push(`\`\`\`\n`);
                lines.push(`Datum: ${call.timestamp.toLocaleString('de-DE')}`);
                lines.push(`Abgenommen: ${call.answered ? 'Ja' : 'Nein'}`);
                lines.push(`Anrufer Unterdrückt: ${call.hide_caller_id ? 'Ja' : 'Nein'}`);
                lines.push(`Dauer: ${call.duration} Sekunden`);
                lines.push(`\`\`\`\n`);
                return lines.join('\n');
            },
            2000,
        );

        if (pages.length === 0) {
            await this.replyWithEmbed({
                description: `Der user hat noch keine Anrufshistorie.`,
            });
            return;
        }

        if (page > pages.length) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            description: pages[page - 1],
            title: `Anrufhistorie von: ${vPlayer.playerdata.fullname} | Seite ${page} von ${pages.length}`,
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

    private async template(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamID = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamID}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }
        const phone = await PhoneService.getPhoneBySteamID(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: `Der Spieler **${vPlayer.playerdata.fullname}** (${steamID}) hat kein Handy!`,
                ephemeral: true,
            });
            return;
        }
        const fields: IEmbedField[] = [];

        await this.replyWithEmbed({
            title: `TEXT: ${vPlayer.playerdata.fullname}`,
            description: ` `,
            fields,
        });
    }
}
