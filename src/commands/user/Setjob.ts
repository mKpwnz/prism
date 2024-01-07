import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { PlayerService } from '@services/PlayerService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { GameDB } from '@sql/Database';
import { IJob } from '@sql/schema/Job.schema';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RowDataPacket } from 'mysql2';

export class Setjob extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.DEV.BOTTEST,
        ];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('setjob')
                .setDescription('Befehle um einen User in einen Job zu setzen')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('online')
                        .setDescription('Setze den Job eines Spieler, der online ist')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('jobname')
                                .setDescription('Name des Jobs')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('grade')
                                .setDescription('Grade des Spielers (Startet ab 0) (Default: 0)'),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('offline')
                        .setDescription('Setze den Job eines Spieler, der offline ist')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('jobname')
                                .setDescription('Name des Jobs')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('grade')
                                .setDescription('Grade des Spielers (Startet ab 0) (Default: 0)'),
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;

        if (options.getSubcommand() === 'online') {
            await this.setOnline(interaction);
        } else if (options.getSubcommand() === 'offline') {
            await this.setOffline(interaction);
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
        }
    }

    private async setOnline(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        const job = options.getString('jobname');
        const grade = options.getInteger('grade') ?? 0;
        if (!job) {
            await interaction.reply({ content: 'Es wurde kein Job angegeben!', ephemeral: true });
            return;
        }
        try {
            const [jobquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
                job.toLowerCase(),
            ]);
            if (jobquery.length === 0) {
                await interaction.reply({
                    content: 'Es wurde kein Job mit diesem Namen gefunden!',
                    ephemeral: true,
                });
                return;
            }
            await RconClient.sendCommand(
                `setjob ${options.getInteger('id')} ${job.toLowerCase()} ${grade}`,
            );
            embed.setTitle('Job geändert (online)');
            embed.setDescription(
                `Der Job von ID ${options.getInteger(
                    'id',
                )} wurde auf ${job} Grade ${grade} gesetzt!`,
            );
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(
                    error,
                )}\`\`\``,
                ephemeral: true,
            });
        }
    }

    private async setOffline(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        const steamid = options.getString('steamid');
        const job = options.getString('jobname');
        const grade = options.getInteger('grade') ?? 0;
        if (!steamid) {
            await interaction.reply({
                content: 'Es wurde keine SteamID angegeben!',
                ephemeral: true,
            });
            return;
        }
        if (!job) {
            await interaction.reply({ content: 'Es wurde kein Job angegeben!', ephemeral: true });
            return;
        }
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        try {
            const [jobquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
                job.toLowerCase(),
            ]);
            LogManager.debug(jobquery);
            if (jobquery.length === 0) {
                await interaction.reply({
                    content: 'Es wurde kein Job mit diesem Namen gefunden!',
                    ephemeral: true,
                });
                return;
            }
            // TODO: Update zu "affectedRows" mit Database.query<T>
            const query = (await GameDB.query(
                'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ?',
                [job.toLowerCase(), grade, vPlayer.identifiers.steam],
            )) as RowDataPacket[];

            if (query[0].affectedRows === 0) {
                await interaction.reply({
                    content: 'Der Job konnte nicht geändert werden!',
                    ephemeral: true,
                });
                return;
            }
            embed.setTitle('Job geändert (offline)');
            embed.setDescription(
                `Der Job von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde auf ${jobquery[0].label}\nGrade ${grade} gesetzt!`,
            );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }
}
