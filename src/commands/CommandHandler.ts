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
import { ChangeBirthday } from './user/ChangeBirthday'
import { Fraksperre } from './user/Fraksperre'
import { Kick } from './user/Kick'
import { Give } from './user/Give'
import { Revive } from './user/Revive'
import { Resetpos } from './user/Resetpos'
import { Rechnung } from './user/Rechnung'
import { TeamNote } from './user/TeamNote'
import { WhoIs } from './user/WhoIs'
import { Help } from './system/Help'
import { Setjob } from './user/Setjob'

export class CommandHandler {
    static commands: {
        cmd: Command
        scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
    }[] = []
    static prodCommands: string[] = []
    static devCommands: string[] = []

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
        // new Wahl()
        new ServerStatus()
        new Help()

        // Phone Commands
        new CheckImageOwner()

        // Housing Commands
        new SchufaCheck()

        // User Commands
        // new Birthday()
        new WhoIs()
        // new Nvhx()
        // new Give()
        // new TeamNote()
        // new Fraksperre()
        new Rechnung()
        // new Kick()
        // new Revive()
        // new Resetpos()
        // new Setjob()

        // Car Commands
        // new Versicherung()
        LogManager.info('CommandManager: All commands initialized!')
        LogManager.info('Commands [PROD]:', CommandHandler.prodCommands)
        LogManager.info('Commands [DEV]:', CommandHandler.devCommands)
    }
}

export const RegisterCommand = (scb: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder, cmd: Command) => {
    CommandHandler.commands.push({
        cmd: cmd,
        scb: scb,
    })

    if (cmd.RunEnvironment === EENV.PRODUCTION) CommandHandler.prodCommands.push(scb.name)
    if (cmd.RunEnvironment === EENV.DEVELOPMENT) CommandHandler.devCommands.push(scb.name)
    LogManager.debug({
        command: scb.name,
        description: scb.description,
        usePermissions: cmd.CheckPermissions,
        allowedChannels: cmd.AllowedChannels,
        allowedGroups: cmd.AllowedGroups,
    })
}
