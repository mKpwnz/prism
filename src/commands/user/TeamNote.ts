import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { PlayerService } from '@services/PlayerService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { BotDB } from '@sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TeamNote extends Command {
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
                .setName('teamnote')
                .setDescription('Team Notizen')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('hinzufügen')
                        .setDescription('Fügt eine Notiz hinzu')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
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
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
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
        switch (interaction.options.getSubcommand()) {
            case 'hinzufügen':
                await this.addNote(interaction);
                break;
            case 'auflisten':
                await this.listNotes(interaction);
                break;
            case 'anzeigen':
                await this.viewNote(interaction);
                break;
            default:
                await this.replyError('Command nicht gefunden.');
                break;
        }
    }

    private async addNote(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const note = interaction.options.getString('notiz', true);

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Die angegebene SteamID ist ungültig.');
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

        await this.replyWithEmbed({
            title: `Teamnote | Hinzugefügt (ID: ${data.id})`,
            description: 'Die Notiz wurde erfolgreich hinzugefügt.',
            fields: [
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
            ],
        });
    }

    private async listNotes(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            this.replyError('Die angegebene SteamID ist ungültig.');
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
            }** | Erstellt am **${note.created_at.toLocaleString('de-DE')}**\n\`\`\`${
                note.note
            }\`\`\`\n`;
        });

        await this.replyWithEmbed({
            description: `Notizen (${data.length > 5 ? 5 : data.length}/${data.length}) von **${
                vPlayer.playerdata.fullname
            }**  (${vPlayer.identifiers.steam})\n${
                data.length > 5
                    ? `Ausgeblendete IDs: **${data
                          .slice(5)
                          .map((note) => note.id)
                          .join(', ')}**`
                    : ''
            }\n\n${notes}`,
        });
    }

    private async viewNote(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);

        const data = await BotDB.team_notes.findUnique({
            where: {
                id,
            },
        });
        if (!data) {
            await this.replyError('Die angegebene ID ist ungültig.');
            return;
        }
        const vPlayer = await PlayerService.validatePlayer(data.user);
        if (vPlayer) {
            await this.replyWithEmbed({
                description: `Notizen von **${vPlayer.playerdata.fullname}**  (${
                    vPlayer.identifiers.steam
                })\n\nID: **${data.id}** | Erstellt von: **${
                    data.noterName
                }** | Erstellt am **${data.created_at.toLocaleString('de-DE')}**\n\`\`\`${
                    data.note
                }\`\`\`\n`,
            });
        } else {
            await this.replyWithEmbed({
                description: `*Die SteamID konnte keinem Nutzer zugewiesen werden!*\n\nNotizen von **${
                    data.user
                }** \n\nID: **${data.id}** | Erstellt von: **${
                    data.noterName
                }** | Erstellt am **${data.created_at.toLocaleString('de-DE')}**\n\`\`\`${
                    data.note
                }\`\`\`\n`,
            });
        }
    }
}
