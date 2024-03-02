import Config from '@Config';
import Command from '@class/Command';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PhoneDarkchatService } from '@services/PhoneDarkchatService';
import { IPhoneDarkchatSearch } from '@sql/schema/Phone.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
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
                    option.setName('filtervalue').setDescription('Filter Wert').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('von').setDescription('Format: YYYY-MM-DD'),
                )
                .addStringOption((option) =>
                    option.setName('bis').setDescription('Format: YYYY-MM-DD'),
                )
                .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
        ),
)
export class Darkchat extends Command {
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
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        switch (interaction.options.getSubcommand()) {
            case 'getmessages':
                await this.getMessages(interaction);
                break;
            default:
                await interaction.reply({
                    content: 'Command nicht gefunden.',
                    ephemeral: true,
                });
        }
    }

    async getMessages(interaction: ChatInputCommandInteraction): Promise<void> {
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

        const pages = this.splitApiResponse(messages, 2000);

        if (page > pages.length || page < 1) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            description: pages[page - 1],
            title: `Darkchat Suche Seite ${page} von ${pages.length}`,
            color: EEmbedColors.DEFAULT,
        });
    }

    splitApiResponse(messages: IPhoneDarkchatSearch[], pageSize: number): string[] {
        const pages = [];
        let currentPage = '';
        const posts: string[] = [];

        for (const message of messages) {
            posts.push(
                `User: **${message.sender}** ( ${message.steamID} )\nChannel: **${
                    message.channel
                }**\`\`\`${message.timestamp.toLocaleString('de-DE')}\n${message.content}\`\`\`\n`,
            );
        }

        for (const post of posts) {
            // Überprüfe, ob die nächste Zeile hinzugefügt werden kann, ohne das Zeichenlimit zu überschreiten
            if (currentPage.length + post.length + 1 <= pageSize) {
                currentPage += `${post}\n`;
            } else {
                // Füge die aktuelle Seite zu den Seiten hinzu und beginne eine neue Seite
                pages.push(currentPage);
                currentPage = `${post}\n`;
            }
        }

        // Füge die letzte Seite hinzu, wenn vorhanden
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }
}
