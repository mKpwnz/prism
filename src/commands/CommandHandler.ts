import { Command } from '@class/Command'
import { CommandInteraction, Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import { Ping } from './system/Ping'
import { Birthday } from './user/Birthday'
import { WhoIs } from './user/WhoIs'

// NEW CONCEPT
export class CommandHandler {
    static commands: { cmd: Command; scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder }[] = []

    static async onInteraction(interaction: Interaction) {
        if (!interaction.isCommand()) return
        for (const command of CommandHandler.commands) {
            if (command.scb.name === interaction.commandName) {
                await command.cmd.run(interaction)
            }
        }
    }

    static initAll() {
        console.log('Init all Commands')
        // System Commands
        new Ping()

        // User Commands
        new Birthday()
        new WhoIs()
    }
}

export const RegisterCommand = (scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder, cmd: Command) => {
    CommandHandler.commands.push({
        cmd: cmd,
        scb: scb,
    })
    console.log(`Registered Command: ${scb.name}`, {
        usePermissions: cmd.CheckPermissions,
        allowedChannels: cmd.AllowedChannels,
        allowedGroups: cmd.AllowedGroups,
    })
}
