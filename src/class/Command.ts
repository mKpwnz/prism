import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { IEmbedField } from '@interfaces/IEmbedField';
import Config from '@Config';
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
     * @author mKpwnz
     * @date 14.10.2023
     * @type {string[]}
     * @memberof Command
     */
    AllowedChannels: string[] = [];

    /**
     * @description Gibt an, welche Gruppen den Command ausgeführt dürfen (Discord) (ID)
     * @author mKpwnz
     * @date 14.10.2023
     * @type {string[]}
     * @memberof Command
     */
    AllowedGroups: string[] = [];

    /**
     * @description Gibt an, welche User den Command ausführen dürfen (Unabhängig von Gruppenrechten) (Discord) (ID)
     * @author mKpwnz
     * @date 14.10.2023
     * @type {string[]}
     * @memberof Command
     */
    AllowedUsers: string[] = [];

    /**
     * @description Gibt an, welche User den Command nicht ausführen dürfen (Unabhängig von Gruppenrechten) (Discord) (ID)
     * @author mKpwnz
     * @date 14.10.2023
     * @type {string[]}
     * @memberof Command
     */
    BlockedUsers: string[] = [];

    /**
     * @description Gibt an, ob die Permissions geprüft werden sollen oder nicht.
     * @author mKpwnz
     * @date 14.10.2023
     * @type {Boolean} [CheckPermissions=true]
     * @memberof Command
     */
    CheckPermissions: Boolean = true;

    /**
     * @description Gibt an, in welcher Umgebung der Command ausgeführt werden darf.
     * @author mKpwnz
     * @date 14.10.2023
     * @type {EENV} [RunEnvironment=EENV.DEVELOPMENT]
     * @memberof Command
     */
    RunEnvironment: EENV = EENV.DEVELOPMENT;

    /**
     * @description Gibt an, ob der Command ein Beta Command ist oder nicht.
     * @author mKpwnz
     * @date 14.10.2023
     * @type {boolean} [IsBetaCommand=false]
     * @memberof Command
     */
    IsBetaCommand: boolean = false;

    /**
     * @description Gibt an, ob der Command nicht gezählt werden soll (Statistik)
     * @author mKpwnz
     * @date 14.10.2023
     * @type {boolean} [DoNotCountUse=false]
     * @memberof Command
     */
    DoNotCountUse: boolean = false;

    /**
     * @description Gibt an, wann der Command ausgeführt wurde. (Timestamp)
     * @type {Date}
     * @memberof Command
     */
    CmdPerformanceStart: Date | undefined = undefined;

    /**
     * @description Gibt an, wann der Command fertig ausgeführt wurde. (Timestamp)
     * @type {Date}
     * @memberof Command
     */
    CmdPerformanceStop: Date | undefined = undefined;

    /**
     * @description Führt den Command aus. Muss in der Klasse, die von Command erbt, implementiert werden. (execute() { ... })
     * @author mKpwnz
     * @date 14.10.2023
     * @abstract
     * @param {ChatInputCommandInteraction} interaction
     * @returns {*}  {Promise<void>}
     * @memberof Command
     */
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

    /**
     * @description Wird vom CommandHandler ausgeführt
     * @author mKpwnz
     * @date 14.10.2023
     * @param {ChatInputCommandInteraction} interaction
     * @returns {*}  {Promise<void>}
     * @memberof Command
     */
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options, user } = interaction;

        // Override Channel in Devmode
        if (this.RunEnvironment !== EENV.PRODUCTION) {
            this.DoNotCountUse = true;
            this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI];
            this.AllowedGroups = [
                Config.Discord.Groups.DEV_SERVERENGINEER,
                Config.Discord.Groups.DEV_BOTTESTER,
            ];
        }
        if (process.env.NODE_ENV !== 'production') {
            this.DoNotCountUse = true;
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
        } catch (error) {
            const errobj: { [k: string]: any } = {};
            if (error instanceof Error) {
                errobj.name = error.name;
                errobj.message = error.message;
            } else {
                errobj.e = error;
            }
            LogManager.error(errobj);
            await this.replyWithEmbed({
                interaction,
                title: 'Es ist ein Fehler aufgetreten!',
                description: `\`\`\`json\n${JSON.stringify(errobj, null, 2)}\n\`\`\``,
                color: EEmbedColors.ALERT,
            });
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
    static getEmbedTemplate(interaction: ChatInputCommandInteraction): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(EEmbedColors.DEFAULT)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Pictures.WHITESPACE);
    }

    async replyWithEmbed(opt: {
        interaction: ChatInputCommandInteraction;
        title: string;
        description: string;
        messageContent?: string;
        fields?: IEmbedField[];
        customImage?: string;
        color?: EEmbedColors | number;
        ephemeral?: boolean;
    }): Promise<void> {
        this.CmdPerformanceStop = new Date();
        const executionTime =
            this.CmdPerformanceStop.getTime() - this.CmdPerformanceStart!.getTime();

        const embed = new EmbedBuilder()
            .setTitle(opt.title)
            .setDescription(opt.description)
            .setColor(opt.color ?? EEmbedColors.DEFAULT)
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: `${opt.interaction.user.displayName ?? ''} • ET: ${executionTime}ms`,
                iconURL: opt.interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setFields(opt.fields ?? [])
            .setImage(opt.customImage ?? Config.Pictures.WHITESPACE);

        await opt.interaction.reply({
            content: opt.messageContent ?? '',
            embeds: [embed],
            ephemeral: opt.ephemeral,
        });
    }
}
