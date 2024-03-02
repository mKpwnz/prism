import Config from '@Config';
import Command from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { IJob } from '@sql/schema/Job.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('setjob')
        .setDescription('Befehle um einen User in einen Job zu setzen')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('online')
                .setDescription('Setze den Job eines Spieler, der online ist')
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('jobname').setDescription('Name des Jobs').setRequired(true),
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
                    option.setName('jobname').setDescription('Name des Jobs').setRequired(true),
                )
                .addIntegerOption((option) =>
                    option
                        .setName('grade')
                        .setDescription('Grade des Spielers (Startet ab 0) (Default: 0)'),
                ),
        ),
)
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
        const id = interaction.options.getInteger('id', true);
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

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }

        const [jobquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
            job.toLowerCase(),
        ]);
        if (jobquery.length === 0) {
            await this.replyError('Es wurde kein Job mit diesem Namen gefunden!');
            return;
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
