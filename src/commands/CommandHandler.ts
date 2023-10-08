import { Command } from '@class/Command'
import { EENV } from '@enums/EENV'
import LogManager from '@utils/Logger'
import { Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import { Versicherung } from './cars/Versicherung'
import { SchufaCheck } from './housing/SchufaCheck'
import { Nvhx } from './nvhx/Nvhx'
import { CheckImageOwner } from './phone/CheckImageOwner'
import { Ping } from './system/Ping'
import { ServerStatus } from './system/ServerStatus'
import { Wahl } from './system/Wahl'
import { Birthday } from './user/Birthday'
import { Fraksperre } from './user/Fraksperre'
import { Kick } from './user/Kick'
import { Rechnung } from './user/Rechnung'
import { TeamNote } from './user/TeamNote'
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
        // new Nvhx()
        // System Commands
        new Ping()
        // new Wahl()
        new ServerStatus()

        // Phone Commands
        new CheckImageOwner()

        // Housing Commands
        new SchufaCheck()

        // User Commands
        // new Birthday()
        new WhoIs()
        // new TeamNote()
        // new Fraksperre()
        // new Rechnung()
        new Kick()

        // Car Commands
        // new Versicherung()
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
