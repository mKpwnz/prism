import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { BotClient } from '@proot/Bot'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { ITeamNote } from '@sql/schema/TeamNote.schema'
import LogManager from '@utils/Logger'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    CommandInteraction,
    EmbedBuilder,
    Interaction,
    SlashCommandBuilder,
    User,
} from 'discord.js'
import { WhoIs } from './WhoIs'
import { EENV } from '@enums/EENV'

// TODO: Refactor this command
export class TeamNote extends Command {
    constructor() {
        super()
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('teamnote')
                .setDescription('Team Notizen')
                .addStringOption((option) =>
                    option
                        .setName('action')
                        .setDescription('Was möchtest du machen?')
                        .addChoices(
                            { name: 'Hinzufügen', value: 'add' },
                            { name: 'Anzeigen', value: 'view' },
                            { name: 'Löschen', value: 'delete' },
                        )
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
                )
                .addIntegerOption((option) =>
                    option.setName('noteid').setDescription('ID der Notiz').setRequired(false),
                ),
            this,
        )
        BotClient.on('interactionCreate', this.onInteraction)
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { channel, user, guild, options } = interaction
        const action = options.get('action')?.value as string
        const steamid = options.get('steamid')?.value as string
        const noteid = options.get('noteid')?.value as number

        if (!channel) {
            await interaction.reply('Das darfst du hier nicht!')
            return
        }
        if (!action) {
            await interaction.reply({ content: 'Du musst eine Aktion angeben!', ephemeral: true })
            return
        }
        if (!steamid) {
            await interaction.reply({ content: 'Du musst eine SteamID angeben!', ephemeral: true })
            return
        }
        const player = await WhoIs.validateUser(steamid)
        if (!player) {
            await interaction.reply({ content: 'Die SteamID ist nicht gültig!', ephemeral: true })
            return
        }

        if (action === 'add') {
            await interaction.reply({
                content: `Notiz für **${player.firstname} ${player.lastname}** | **${player.identifier}**`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('Notiz erstellen')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId('teamnode_add_note'),
                    ),
                ],
                ephemeral: true,
            })
        } else if (action === 'delete') {
            if (!noteid) {
                await interaction.reply({ content: 'Du musst eine Notiz ID angeben!', ephemeral: true })
                return
            }
            const note = await this.getNote(steamid, noteid)
            if (!note) {
                await interaction.reply({
                    content: `Die Notiz ID konnte bei dem Spieler ${player.identifier} nicht gefunden werden!`,
                    ephemeral: true,
                })
                return
            }
            LogManager.debug(note)
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xe91916)
                        .setTitle('Teamnote löschen')
                        .setAuthor({
                            name: Config.Discord.BOT_NAME,
                            iconURL: Config.Pictures.Prism.LOGO_BLUE,
                        })
                        .addFields(
                            {
                                name: 'Teamnote ID',
                                value: `${note.id}`,
                                inline: true,
                            },
                            {
                                name: 'Erstellt von',
                                value: `${note.teamler_discordname}`,
                                inline: true,
                            },
                            {
                                name: 'Erstellt von (DC)',
                                value: `<@${note.teamler_discordid}>`,
                                inline: true,
                            },
                            {
                                name: 'Spieler (IC Name)',
                                value: `${player.firstname} ${player.lastname}`,
                                inline: true,
                            },
                            {
                                name: 'Spieler (SteamID)',
                                value: `${player.identifier}`,
                                inline: true,
                            },
                            {
                                name: 'Spieler (Job)',
                                value: `${player.job} (${player.job_grade})`,
                                inline: true,
                            },
                            {
                                name: 'Notiz',
                                value: `${note.note}`,
                                inline: false,
                            },
                        )
                        .setImage('https://i.imgur.com/pdkIDFc.png')
                        .setTimestamp(),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abbrechen')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId('teamnode_delete_confirm_no'),
                        new ButtonBuilder()
                            .setLabel('Notiz löschen')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId('teamnode_delete_confirm_yes'),
                    ),
                ],
                ephemeral: true,
            })
            return
        } else if (action === 'view') {
            const notes = await this.getNotes(steamid)
            if (notes) {
                let message = `Alle Notizen (${notes.length}) zu ${player.name} (${player.identifier})`
                var embeds = []
                for (const note of notes) {
                    embeds.push(
                        new EmbedBuilder()
                            .setColor(0x0792f1)
                            .setTitle(`Teamnote ${note.id}`)
                            .addFields(
                                {
                                    name: 'Teamnote ID',
                                    value: `${note.id}`,
                                    inline: true,
                                },
                                {
                                    name: 'Erstellt von',
                                    value: `${note.teamler_discordname}`,
                                    inline: true,
                                },
                                {
                                    name: 'Erstellt von (DC)',
                                    value: `<@${note.teamler_discordid}>`,
                                    inline: true,
                                },
                                {
                                    name: 'Spieler (IC Name)',
                                    value: `${player.firstname} ${player.lastname}`,
                                    inline: true,
                                },
                                {
                                    name: 'Spieler (SteamID)',
                                    value: `${player.identifier}`,
                                    inline: true,
                                },
                                {
                                    name: 'Spieler (Job)',
                                    value: `${player.job} (${player.job_grade})`,
                                    inline: true,
                                },
                                {
                                    name: 'Notiz',
                                    value: `${note.note}`,
                                    inline: false,
                                },
                            )
                            .setImage('https://i.imgur.com/pdkIDFc.png')
                            .setTimestamp(),
                    )
                }
                await interaction.reply({ content: message, embeds: embeds })
            } else {
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        }
    }
    async onInteraction(interaction: Interaction) {}
    private async addNote(user_steamid: string, teamler: User, note: string): Promise<boolean> {
        try {
            let query =
                'INSERT INTO `team_notes` (`user_steamid`, `teamler_discordid`, `teamler_discordname`, `note`) VALUES ( ?, ?, ?, ?);'
            const response = await Database.query(query, [user_steamid, teamler.id, teamler.displayName, note])
            if (response) {
                return true
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
    private async getNotes(user_steamid: string): Promise<ITeamNote[] | false> {
        try {
            let query = 'SELECT * FROM `team_notes` WHERE `user_steamid` = ?;'
            const [notes] = await Database.query<ITeamNote[]>(query, [user_steamid])
            if (notes && notes.length > 0) {
                return notes
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
    private async getNote(user_steamid: string, noteid: number): Promise<ITeamNote | false> {
        try {
            let query = 'SELECT * FROM `team_notes` WHERE `user_steamid` = ? AND `id` = ?;'
            const [notes] = await Database.query<ITeamNote[]>(query, [user_steamid, noteid])
            if (notes && notes.length == 1) {
                return notes[0]
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
    private async removeNote(user_steamid: string, noteid: number) {
        try {
            let query = 'DELETE FROM `team_notes` WHERE `user_steamid` = ? AND `id` = ?;'
            const response = await Database.query(query, [user_steamid, noteid])
            if (response) {
                return true
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
}
