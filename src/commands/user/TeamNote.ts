import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { Player } from '@controller/Player.controller';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import { BotDB } from '@sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TeamNote extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED];
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
                .setName('teamnote')
                .setDescription('Team Notizen')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('hinzufügen')
                        .setDescription('Fügt eine Notiz hinzu')
                        .addStringOption((option) =>
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
                        )
                        .addStringOption((option) =>
                            option.setName('notiz').setDescription('Die Notiz').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('auflisten')
                        .setDescription('Zeigt alle Notizen eines Spielers an')
                        .addStringOption((option) =>
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('anzeigen')
                        .setDescription('Zeigt eine Notiz an')
                        .addIntegerOption((option) =>
                            option.setName('id').setDescription('ID der Notiz').setRequired(true),
                        ),
                ),
            this,
        );
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'hinzufügen') {
            await this.addNote(interaction);
        } else if (interaction.options.getSubcommand() === 'auflisten') {
            await this.listNotes(interaction);
        } else if (interaction.options.getSubcommand() === 'anzeigen') {
            await this.viewNote(interaction);
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
        }
    }

    private async addNote(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        const steamid = options.getString('steamid');
        const note = options.getString('notiz');

        if (!steamid) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Es wurde keine SteamID angegeben.');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamid);
        if (!vPlayer) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Die angegebene SteamID ist ungültig.');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        if (!note) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Es wurde keine Notiz angegeben.');
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const data = await BotDB.team_notes.create({
            data: {
                user: vPlayer.identifiers.steam,
                noterId: interaction.user.id,
                noterName: interaction.user.username,
                note,
            },
        });
        embed.setTitle(`Teamnote | Hinzugefügt (ID: ${data.id})`);
        embed.setFields([
            {
                name: 'User (IC Name)',
                value: vPlayer.playerdata.fullname,
                inline: true,
            },
            {
                name: 'User (SteamID)',
                value: vPlayer.identifiers.steam,
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Hinzugefügt von',
                value: `${data.noterName} (${data.noterId})`,
                inline: true,
            },
            {
                name: 'Hinzugefügt am',
                value: data.created_at.toLocaleString('de-DE'),
                inline: true,
            },
            {
                name: 'Notiz',
                value: data.note,
            },
        ]);
        await interaction.reply({ embeds: [embed] });
    }

    private async listNotes(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        const steamid = options.getString('steamid');

        if (!steamid) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Es wurde keine SteamID angegeben.');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamid);
        if (!vPlayer) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Die angegebene SteamID ist ungültig.');
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const data = await BotDB.team_notes.findMany({
            where: {
                user: vPlayer.identifiers.steam,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        let notes = '';
        data.slice(0, 5).forEach((note) => {
            notes += `ID: **${note.id}** | Erstellt von: **${
                note.noterName
            }** | Erstellt am **${note.created_at.toLocaleString('de-DE')}**\n\`\`\`${note.note}\`\`\`\n`;
        });
        embed.setDescription(
            `Notizen (${data.length > 5 ? 5 : data.length}/${data.length}) von **${vPlayer.playerdata.fullname}**  (${
                vPlayer.identifiers.steam
            })\n${
                data.length > 5
                    ? `Ausgeblendete IDs: **${data
                          .slice(5)
                          .map((note) => note.id)
                          .join(', ')}**`
                    : ''
            }\n\n${notes}`,
        );
        await interaction.reply({ embeds: [embed] });
    }

    private async viewNote(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        const id = options.getInteger('id');

        if (!id) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Es wurde keine ID angegeben.');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const data = await BotDB.team_notes.findUnique({
            where: {
                id,
            },
        });
        if (!data) {
            embed.setTitle('Teamnote | Fehler');
            embed.setDescription('Die angegebene ID ist ungültig.');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const vPlayer = await Player.validatePlayer(data.user);
        if (vPlayer) {
            embed.setDescription(
                `Notizen von **${vPlayer.playerdata.fullname}**  (${vPlayer.identifiers.steam})\n\nID: **${
                    data.id
                }** | Erstellt von: **${data.noterName}** | Erstellt am **${data.created_at.toLocaleString(
                    'de-DE',
                )}**\n\`\`\`${data.note}\`\`\`\n`,
            );
        } else {
            embed.setDescription(
                `*Die SteamID konnte keinem Nutzer zugewiesen werden!*\n\nNotizen von **${data.user}** \n\nID: **${
                    data.id
                }** | Erstellt von: **${data.noterName}** | Erstellt am **${data.created_at.toLocaleString(
                    'de-DE',
                )}**\n\`\`\`${data.note}\`\`\`\n`,
            );
        }
        await interaction.reply({ embeds: [embed] });
    }
}
