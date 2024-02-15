import Config from '@Config';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { IEmbedOptions } from '@interfaces/IEmbed';
import { BotDB } from '@sql/Database';
import { Helper } from '@utils/Helper';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @abstract
 * @class Command
 */
export abstract class Command {
    /**
     * @description Gibt an, in welchen Kanälen der Command ausgeführt werden darf (Discord) (ID)
     * @type {string[]}
     * @memberof Command
     */
    AllowedChannels: string[] = [];

    /**
     * @description Gibt an, welche Gruppen den Command ausgeführt dürfen (Discord) (ID)
     * @type {string[]}
     * @memberof Command
     */
    AllowedGroups: string[] = [];

    /**
     * @description Gibt an, welche User den Command ausführen dürfen (Unabhängig von Gruppenrechten) (Discord) (ID)
     * @type {string[]}
     * @memberof Command
     */
    AllowedUsers: string[] = [];

    /**
     * @description Gibt an, welche User den Command nicht ausführen dürfen (Unabhängig von Gruppenrechten) (Discord) (ID)
     * @type {string[]}
     * @memberof Command
     */
    BlockedUsers: string[] = [];

    /**
     * @description Gibt an, ob die Permissions geprüft werden sollen oder nicht.
     * @type {Boolean} [CheckPermissions=true]
     * @memberof Command
     */
    CheckPermissions: Boolean = true;

    /**
     * @description Gibt an, in welcher Umgebung der Command ausgeführt werden darf.
     * @type {EENV} [RunEnvironment=EENV.DEVELOPMENT]
     * @memberof Command
     */
    RunEnvironment: EENV = EENV.DEVELOPMENT;

    /**
     * @description Gibt an, ob der Command ein Beta Command ist oder nicht.
     * @type {boolean} [IsBetaCommand=false]
     * @memberof Command
     */
    IsBetaCommand: boolean = false;

    /**
     * @description Gibt an, ob der Command nicht gezählt werden soll (Statistik)
     * @type {boolean} [DoNotCountUse=false]
     * @memberof Command
     */
    DoNotCountUse: boolean = false;

    /**
     * @description Gibt an, wann der Command ausgeführt wurde. (Timestamp)
     * @type {Date}
     * @memberof Command
     */
    private CmdPerformanceStart: Date | undefined = undefined;

    /**
     * @description Gibt an, wann der Command fertig ausgeführt wurde. (Timestamp)
     * @type {Date}
     * @memberof Command
     */
    private CmdPerformanceStop: Date | undefined = undefined;

    /**
     * @description Gibt an, welcher EmbedTitle für Fehlermeldungen benutzt werden soll.
     * @type {string}
     * @memberof Command
     */
    EmbedTitle: string = this.constructor.name;

    /**
     * @description
     * @private
     * @type {(ChatInputCommandInteraction | undefined)}
     * @memberof Command
     */
    private currentInteraction: ChatInputCommandInteraction | undefined;

    /**
     * @description Führt den Command aus. Muss in der Klasse, die von Command erbt, implementiert werden. (execute() { ... })
     * @abstract
     * @param {ChatInputCommandInteraction} interaction
     * @returns {*}  {Promise<void>}
     * @memberof Command
     */
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

    /**
     * @description Wird vom CommandHandler ausgeführt
     * @param {ChatInputCommandInteraction} interaction
     * @returns {*}  {Promise<void>}
     * @memberof Command
     */
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        this.currentInteraction = interaction;
        const { options, user } = interaction;

        // Override Channel in Devmode
        if (process.env.NODE_ENV !== 'production') {
            this.DoNotCountUse = true;
            this.AllowedChannels = [Config.Channels.DEV.PRISM_TESTING];
            this.AllowedGroups = [Config.Groups.DEV.BOTTEST];
        }
        if (this.CheckPermissions) {
            // Check Permissions
            if (
                (await Helper.IsUserAllowed(
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
        LogManager.discordActionLog(
            `\` ${interaction.user.displayName} (${user.id}) \` hat im Kanal <#${
                interaction.channelId
            }> den Befehl \`${interaction.commandName}\` ausgeführt:\`\`\`json\n${JSON.stringify(
                cmdPrint,
                null,
                4,
            )}\`\`\``,
        );
        let { commandName } = interaction;
        if (!this.DoNotCountUse) {
            try {
                if (interaction.options.getSubcommand()) {
                    commandName += ` ${interaction.options.getSubcommand()}`;
                }
            } catch (e) {
                commandName = interaction.commandName;
            }
            await BotDB.command_log.create({
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
            await this.execute(interaction);
            this.currentInteraction = undefined;
        } catch (error) {
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

    /**
     * @description Gibt ein Embed Template zurück, welches für die meisten Commands verwendet werden kann. (Footer, Author, Timestamp, Color, Image, etc.)
     * @author mKpwnz
     * @date 14.10.2023
     * @param {ChatInputCommandInteraction} interaction
     * @returns {*}  {EmbedBuilder}
     * @memberof Command
     * @deprecated
     */
    static getEmbedTemplateOld(interaction: ChatInputCommandInteraction): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(EEmbedColors.DEFAULT)
            .setTimestamp()
            .setAuthor({
                name: Config.Bot.BOT_NAME,
                iconURL: Config.Bot.BOT_LOGO,
            })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Bot.WHITESPACE);
    }

    getEmbedTemplate(opt: IEmbedOptions): EmbedBuilder {
        if (!this.currentInteraction) throw new Error('Unknown Interaction in Command Class');
        this.CmdPerformanceStop = new Date();
        const executionTime = this.CmdPerformanceStart
            ? this.CmdPerformanceStop.getTime() - this.CmdPerformanceStart.getTime()
            : 0;

        return new EmbedBuilder()
            .setTitle(opt.title || this.EmbedTitle)
            .setDescription(opt.description)
            .setColor(opt.color ?? EEmbedColors.DEFAULT)
            .setAuthor({
                name: Config.Bot.BOT_NAME,
                iconURL: Config.Bot.BOT_LOGO,
            })
            .setFooter({
                text: `${this.currentInteraction.user.displayName ?? ''} • ET: ${executionTime}ms`,
                iconURL: this.currentInteraction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setFields(opt.fields ?? [])
            .setImage(opt.customImage ?? Config.Bot.WHITESPACE);
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
