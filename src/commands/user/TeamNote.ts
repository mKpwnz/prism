import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { BotClient } from '@proot/Bot'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, Interaction, SlashCommandBuilder, User } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'

export class TeamNote extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.PRISM_DISCORDBOT]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_PRISM]
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
                ) as SlashCommandBuilder,
            this,
        )
        BotClient.on('interactionCreate', this.onInteraction)
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild, options } = interaction
        const action = options.get('action')?.value as string
        const steamid = options.get('steamid')?.value as string
        const noteid = options.get('noteid')?.value as number

        if (!channel) {
            await interaction.reply('Das darfst du hier nicht!')
            return
        }
        if (!action) {
            await interaction.reply('Du musst eine Aktion angeben!')
            return
        }
        if (!steamid) {
            await interaction.reply('Du musst eine SteamID angeben!')
            return
        }
        const player = await WhoIs.validateUser(steamid)
        if (!player) {
            await interaction.reply('Die SteamID ist nicht gültig!')
            return
        }

        if (action === 'add') {
            await this.addNote(steamid, user, 'Test')
            await channel.send('Diese Funktion ist noch nicht verfügbar!')
        } else if (action === 'delete') {
            if (!noteid) {
                await channel.send('Du musst eine NotizID angeben!')
                return
            }
            await channel.send('Diese Funktion ist noch nicht verfügbar!')
            return
        } else if (action === 'view') {
            const notes = await this.getNotes(steamid)
            if (notes) {
                let message = `Alle Notizen (${notes.length}) zu ${player.name} (${player.steamid})`
                for (const note of notes) {
                    message += `\`\`\`ID: ${note.id}\nTeamler: ${note.teamler_discordname} (${note.teamler_discordid})\nNotiz: ###########################\n${note.note}\`\`\``
                }
                await channel.send(message)
            } else {
                await channel.send('Es ist ein Fehler aufgetreten!')
            }
        }
    }
    async onInteraction(interaction: Interaction) {}
    async addNote(user_steamid: string, teamler: User, note: string): Promise<boolean> {
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
    async getNotes(user_steamid: string) {
        try {
            let query = 'SELECT * FROM `team_notes` WHERE `user_steamid` = ?;'
            const response = await Database.query(query, [user_steamid])
            if (response) {
                return response[0] as RowDataPacket[]
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
    async removeNote(user_steamid: string, noteid: number) {
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
