import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { Player } from '@controller/Player.controller';
import { EENV } from '@enums/EENV';
import { EmbedColors } from '@enums/EmbedColors';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class ChangeBirthday extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_RENAME];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ];
        this.AllowedUsers = [
            Config.Discord.Users.List.L33V33N,
            Config.Discord.Users.List.ZMASTER,
            Config.Discord.Users.List.MANU,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('changebirthday')
                .setDescription('Ändert den Geburtstag eines Nutzers')
                // add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('datum')
                        .setDescription('Neuer Geburtstag des Spielers (dd.mm.yyyy)')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const birthday = options.getString('datum');
        const steamID = options.getString('steam');
        const embed = this.getEmbedTemplate(interaction);
        if (!birthday) {
            await interaction.reply({
                content: 'Es wurde kein Geburtstag angegeben!',
                ephemeral: true,
            });
            return;
        }
        if (!steamID) {
            await interaction.reply({
                content: 'Es wurde keine SteamID angegeben!',
                ephemeral: true,
            });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }

        try {
            if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(birthday)) {
                const [res] = await GameDB.execute<ResultSetHeader>(
                    `UPDATE users SET dateofbirth = ? WHERE identifier = ?`,
                    [birthday, vPlayer.identifiers.steam],
                );
                if (res.affectedRows > 0) {
                    embed.setTitle('Geburtstag geändert');
                    embed.setColor(EmbedColors.SUCCESS);
                    embed.setDescription(
                        `Der Geburtstag des Spielers **${vPlayer.playerdata.fullname}** (${vPlayer.identifiers.steam}) wurde auf **${birthday}** geändert.`,
                    );
                    await interaction.reply({ embeds: [embed] });
                } else {
                    embed.setTitle('Geburtstag nicht geändert');
                    embed.setColor(EmbedColors.ALERT);
                    embed.setDescription(
                        `Der Geburtstag des Spielers **${vPlayer.playerdata.fullname}** (${vPlayer.identifiers.steam}) konnte nicht auf **${birthday}** geändert werden.`,
                    );
                    await interaction.reply({ embeds: [embed] });
                }
            } else {
                await interaction.reply({
                    content: 'Das Format des Geburtstags ist nicht korrekt!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }
}
