import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RowDataPacket } from 'mysql2';

export class Rename extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_RENAME,
        ];
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
                .setName('rename')
                .setDescription('Suche nach Spielern')
                .addStringOption((option) =>
                    option
                        .setName('steam')
                        .setDescription('Steam ID des Nutzers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('vorname').setDescription('Vorname des Spielers'),
                )
                .addStringOption((option) =>
                    option.setName('nachname').setDescription('Nachname des Spielers'),
                ),
            this,
        );
    }

    // TODO: Refactor
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steam = interaction.options.get('steam')?.value?.toString() ?? '';
        const vPlayer = await PlayerService.validatePlayer(steam);
        const embed = Command.getEmbedTemplate(interaction);
        if (!vPlayer) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        const firstname =
            interaction.options.get('vorname')?.value?.toString() ?? vPlayer.playerdata.firstname;
        const lastname =
            interaction.options.get('nachname')?.value?.toString() ?? vPlayer.playerdata.lastname;
        // eslint-disable-next-line eqeqeq
        if (firstname == '' && lastname == '') {
            await interaction.reply({
                content: 'Es wurde kein Vor- oder Nachname angegeben!',
                ephemeral: true,
            });
            return;
        }
        try {
            let query = 'UPDATE users SET ';
            LogManager.log(lastname);
            LogManager.log(vPlayer.playerdata.lastname);
            if (firstname !== vPlayer.playerdata.firstname) {
                query += `firstname = '${firstname}'`;
                if (lastname !== vPlayer.playerdata.lastname) {
                    query += ', ';
                }
            }
            if (lastname !== vPlayer.playerdata.lastname) {
                query += `lastname = '${lastname}' `;
            }

            LogManager.log(query);
            const result = (await GameDB.execute(`${query}WHERE identifier = ? `, [
                vPlayer.identifiers.steam,
            ])) as RowDataPacket[];
            if (result[0].rowsChanged !== 0) {
                embed.setTitle('Spieler umbenannt');
                embed.setDescription(
                    `Der Spieler mit dem Namen ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) hat nun den Namen "${firstname} ${lastname}".`,
                );

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: 'Der Spieler konnte nicht umbenannt werden!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }
}
