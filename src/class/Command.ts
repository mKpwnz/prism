import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { commandLog } from '@prism/sql/botSchema/BotSchema';
import { EENV } from '@prism/typings/enums/EENV';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import { IEmbedOptions } from '@prism/typings/interfaces/IEmbed';
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

    EmbedTitle: string = this.constructor.name;

    private CmdPerformanceStart: Date | undefined = undefined;

    private CmdPerformanceStop: Date | undefined = undefined;

    private currentInteraction: ChatInputCommandInteraction | undefined;

    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

    private envOverrides() {
        if (Config.ENV.NODE_ENV === 'staging') {
            this.DoNotLog = true;
            this.AllowedChannels = [
                Config.Channels.STAGING.TESTING,
                Config.Channels.STAGING.TESTING_2,
                Config.Channels.STAGING.IMAGE_UPLOAD,
            ];
            this.AllowedGroups = [Config.Groups.DEV.BOTTEST];
        }

        if (Config.ENV.NODE_ENV === 'development') {
            this.DoNotLog = true;
            this.AllowedChannels = [
                Config.Channels.DEV.TESTING,
                Config.Channels.DEV.TESTING_2,
                Config.Channels.DEV.IMAGE_UPLOAD,
            ];
            this.AllowedGroups = [Config.Groups.DEV.BOTTEST];
        }
    }

    private async logCommand(interaction: ChatInputCommandInteraction) {
        let { commandName } = interaction;
        const { options, user, channelId } = interaction;
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
            command: commandName,
            options: inputFields,
        };

        if (options.getSubcommandGroup(false)) {
            commandName += ` ${options.getSubcommandGroup()}`;
        }

        if (options.getSubcommand(false)) {
            commandName += ` ${options.getSubcommand()}`;
        }

        await BotDB.insert(commandLog)
            .values({
                command: commandName,
                user: user.id,
                channel: channelId,
                options: cmdPrint.options,
                jsonData: cmdPrint,
            })
            .execute();
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        this.currentInteraction = interaction;

        this.envOverrides();

        if (this.CheckPermissions) {
            if (
                !(await isUserAllowed(interaction, {
                    allowedChannels: this.AllowedChannels,
                    allowedGroups: this.AllowedGroups,
                    allowedUsers: this.AllowedUsers,
                    blockedUsers: this.BlockedUsers,
                }))
            )
                return;
        }

        if (!this.DoNotLog) this.logCommand(interaction);

        try {
            this.CmdPerformanceStart = new Date();
            setTimeout(async () => {
                if (interaction.replied || interaction.deferred) return;
                try {
                    await interaction.deferReply({ ephemeral: true });
                } catch (e) {
                    // LogManager.error(e);
                }
            }, 2000);
            await this.execute(interaction);
            this.currentInteraction = undefined;
        } catch (error) {
            const inputFields: { name: string; value: string }[] = [];
            interaction.options.data.forEach((input) => {
                const d = JSON.parse(JSON.stringify(input));
                inputFields.push({ name: d.name, value: d.value });
            });

            Sentry.captureException(error, {
                user: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                },
                tags: {
                    command: interaction.commandName,
                },
                extra: {
                    parameters: inputFields,
                },
            });
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
        if (!opt.title) opt.title = this.EmbedTitle;
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
