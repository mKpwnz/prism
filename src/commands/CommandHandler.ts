import { Command } from '@class/Command'
import LogManager from '@utils/Logger'
import { Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import { SchufaCheck } from './housing/SchufaCheck'
import { CheckImageOwner } from './phone/CheckImageOwner'
import { Ping } from './system/Ping'
import { Wahl } from './system/Wahl'
import { Birthday } from './user/Birthday'
import { WhoIs } from './user/WhoIs'

export class CommandHandler {
    static commands: {
        cmd: Command
        scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
    }[] = []

    static async onInteraction(interaction: Interaction) {
        if (!interaction.isCommand()) return
        for (const command of CommandHandler.commands) {
            if (command.scb.name === interaction.commandName) {
                await command.cmd.run(interaction)
            }
        }
    }

    static initAll() {
        LogManager.info('CommandManager: Initializing all commands...')
        // System Commands
        new Ping()
        new Wahl()

        // Phone Commands
        new CheckImageOwner()

        // Housing Commands
        new SchufaCheck()

        // User Commands
        new Birthday()
        new WhoIs()
        LogManager.info('CommandManager: All commands initialized!')
    }
}

export const RegisterCommand = (
    scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder,
    cmd: Command,
) => {
    CommandHandler.commands.push({
        cmd: cmd,
        scb: scb,
    })
    LogManager.debug({
        command: scb.name,
        description: scb.description,
        usePermissions: cmd.CheckPermissions,
        allowedChannels: cmd.AllowedChannels,
        allowedGroups: cmd.AllowedGroups,
    })
}
