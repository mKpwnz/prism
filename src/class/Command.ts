import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { EENV } from '@prism/enums/EENV';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import { IEmbedOptions } from '@prism/interfaces/IEmbed';
import LogManager from '@prism/manager/LogManager';
import { BotDB } from '@prism/sql/Database';
import { getEmbedBase, isUserAllowed } from '@prism/utils/DiscordHelper';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export default abstract class Command {
    AllowedChannels: string[] = [];

    AllowedGroups: string[] = [];

    AllowedUsers: string[] = [];

    BlockedUsers: string[] = [];

    CheckPermissions: Boolean = true;

    RunEnvironment: EENV = EENV.DEVELOPMENT;

    IsBetaCommand: boolean = false;

    DoNotLog: boolean = false;

    private CmdPerformanceStart: Date | undefined = undefined;

    private CmdPerformanceStop: Date | undefined = undefined;

    EmbedTitle: string = this.constructor.name;

    private currentInteraction: ChatInputCommandInteraction | undefined;

    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        this.currentInteraction = interaction;
        const { options, user } = interaction;

        // Override Channel in Devmode
        if (Config.ENV.NODE_ENV !== 'production') {
            this.DoNotLog = true;
            this.AllowedChannels = [
                Config.Channels.DEV.PRISM_TESTING,
                Config.Channels.DEV.PRISM_TESTING_2,
                Config.Channels.DEV.PRISM_IMAGE_UPLOAD,
            ];
            this.AllowedGroups = [Config.Groups.DEV.BOTTEST];
        }
        if (this.CheckPermissions) {
            // Check Permissions
            if (
                (await isUserAllowed(
                    interaction,
                    this.AllowedChannels,
                    this.AllowedGroups,
                    this.AllowedUsers,
                    this.BlockedUsers,
                )) === false
            )
                return;
        }

        const inputFields: { name: string; value: string }[] = [];
        options.data.forEach((input) => {
            const d = JSON.parse(JSON.stringify(input));
            inputFields.push({ name: d.name, value: d.value });
        });
        const cmdPrint = {
            user: {
                displayame: user.displayName,
                id: user.id,
            },
            command: interaction.commandName,
            options: inputFields,
        };
        let { commandName } = interaction;
        if (!this.DoNotLog) {
            try {
                if (interaction.options.getSubcommand()) {
                    commandName += ` ${interaction.options.getSubcommand()}`;
                }
            } catch (e) {
                Sentry.captureException(e);
                commandName = interaction.commandName;
            }
            BotDB.command_log.create({
                data: {
                    command: commandName,
                    user: user.id,
                    channel: interaction.channelId,
                    options: cmdPrint.options,
                    jsonData: cmdPrint,
                },
            });
        }
        try {
            this.CmdPerformanceStart = new Date();
            setTimeout(async () => {
                if (interaction.replied || interaction.deferred) return;
                await interaction.deferReply({ ephemeral: true });
            }, 2000);
            await this.execute(interaction);
            this.currentInteraction = undefined;
        } catch (error) {
            Sentry.captureException(error);
            const errobj: { [k: string]: any } = {};
            if (error instanceof Error) {
                errobj.name = error.name;
                errobj.message = error.message;
                LogManager.debug(error.stack);
            } else {
                errobj.e = error;
            }
            LogManager.error(errobj);
            await this.replyError(
                `\`\`\`json\n${JSON.stringify(errobj, null, 2)}\n\`\`\``,
                'Es ist ein Fehler aufgetreten!',
            );
        }
    }

    getEmbedTemplate(opt: IEmbedOptions): EmbedBuilder {
        if (!this.currentInteraction) throw new Error('Unknown Interaction in Command Class');
        this.CmdPerformanceStop = new Date();
        const executionTime = this.CmdPerformanceStart
            ? this.CmdPerformanceStop.getTime() - this.CmdPerformanceStart.getTime()
            : 0;

        return getEmbedBase(opt).setFooter({
            text: `${this.currentInteraction.user.displayName ?? ''} • ET: ${executionTime}ms`,
            iconURL: this.currentInteraction.user.avatarURL() ?? Config.Bot.BOT_LOGO,
        });
    }

    async replyWithEmbed(opt: IEmbedOptions): Promise<void> {
        if (!this.currentInteraction) throw new Error('Unknown Interaction in Command Class');
        const embed = this.getEmbedTemplate(opt);

        if (this.currentInteraction.deferred) {
            await this.currentInteraction.editReply({
                content: opt.messageContent ?? '',
                embeds: [embed],
                files: opt.files ?? [],
            });
        } else {
            await this.currentInteraction.reply({
                content: opt.messageContent ?? '',
                embeds: [embed],
                ephemeral: opt.ephemeral,
                files: opt.files ?? [],
            });
        }
    }

    async replyError(msg: string, title: string = this.EmbedTitle): Promise<void> {
        if (!this.currentInteraction) throw new Error('Unknown Interaction in Command Class');
        await this.replyWithEmbed({
            title,
            description: msg,
            color: EEmbedColors.ALERT,
        });
    }
}
