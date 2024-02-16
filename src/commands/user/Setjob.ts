import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { IJob } from '@sql/schema/Job.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class Setjob extends Command {
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
        switch (interaction.options.getSubcommand()) {
            case 'online':
                await this.setOnline(interaction);
                break;
            case 'offline':
                await this.setOffline(interaction);
                break;
            default:
                await this.replyError('Command nicht gefunden.');
                break;
        }
    }

    private async setOnline(interaction: ChatInputCommandInteraction): Promise<void> {
<<<<<<< 313859ff3b295d6e567f8ec4713f8ef890ef3257
        const { options } = interaction;
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
            this.replyWithEmbed({
                interaction,
                title: 'Job geändert (online)',
                description: `Der Job von ID ${options.getInteger(
                    'id',
                )} wurde auf ${job} Grade ${grade} gesetzt!`,
            });
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
=======
        const id = interaction.options.getString('id', true);
        const job = interaction.options.getString('jobname', true);
        const grade = interaction.options.getInteger('grade') ?? 0;

        const [jobquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
            job.toLowerCase(),
        ]);
        if (jobquery.length === 0) {
            await this.replyError('Es wurde kein Job mit diesem Namen gefunden!');
            return;
        }
        await RconClient.sendCommand(`setjob ${id} ${job.toLowerCase()} ${grade}`);
        await this.replyWithEmbed({
            title: 'Job geändert (online)',
            description: `Der Job von ID ${id} wurde auf ${job} Grade ${grade} gesetzt!`,
        });
    }

    private async setOffline(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const job = interaction.options.getString('jobname', true);
        const grade = interaction.options.getInteger('grade') ?? 0;

>>>>>>> 273ad9d5417780a926112df3d7418e57d8fdd6e7
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
<<<<<<< 313859ff3b295d6e567f8ec4713f8ef890ef3257
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

            const [query] = await GameDB.query<ResultSetHeader>(
                'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ?',
                [job.toLowerCase(), grade, vPlayer.identifiers.steam],
            );

            if (query.affectedRows === 0) {
                await interaction.reply({
                    content: 'Der Job konnte nicht geändert werden!',
                    ephemeral: true,
                });
                return;
            }

            this.replyWithEmbed({
                interaction,
                title: 'Job geändert (offline)',
                description: `Der Job von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde auf ${jobquery[0].label}\nGrade ${grade} gesetzt!`,
            });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
=======

        const [jobquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
            job.toLowerCase(),
        ]);
        if (jobquery.length === 0) {
            await this.replyError('Es wurde kein Job mit diesem Namen gefunden!');
            return;
>>>>>>> 273ad9d5417780a926112df3d7418e57d8fdd6e7
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ?',
            [job.toLowerCase(), grade, vPlayer.identifiers.steam],
        );

        if (res.affectedRows === 0) {
            await this.replyError('Der Job konnte nicht geändert werden!');
            return;
        }

        await this.replyWithEmbed({
            title: 'Job geändert (offline)',
            description: `Der Job von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde auf ${jobquery[0].label}\nGrade ${grade} gesetzt!`,
        });
    }
}
