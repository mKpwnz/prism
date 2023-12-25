import { EENV } from '@enums/EENV';
import { EmbedColors } from '@enums/EmbedColors';
import Config from '@proot/Config';
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
            this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER];
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
            `\` ${interaction.user.displayName} (${user.id}) \` hat im Kanal <#${interaction.channelId}> den Befehl \`${
                interaction.commandName
            }\` ausgeführt:\`\`\`json\n${JSON.stringify(cmdPrint, null, 4)}\`\`\``,
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
        // LogManager.debug(logEntry)
        try {
            await this.execute(interaction);
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: `Es ist ein Fehler aufgetreten!\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
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
     */
    getEmbedTemplate(interaction: ChatInputCommandInteraction): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(EmbedColors.DEFAULT)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Pictures.WHITESPACE);
    }
}
