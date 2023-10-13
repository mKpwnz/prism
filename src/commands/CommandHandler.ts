import { Command } from '@class/Command'
import { EENV } from '@enums/EENV'
import LogManager from '@utils/Logger'
import { Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import { SchufaCheck } from './housing/SchufaCheck'
import { Nvhx } from './nvhx/Nvhx'
import { CheckImageOwner } from './phone/CheckImageOwner'
import { Help } from './system/Help'
import { Ping } from './system/Ping'
import { ServerStatus } from './system/ServerStatus'
import { Rechnung } from './user/Rechnung'
import { WhoIs } from './user/WhoIs'
import { Wahl } from './system/Wahl'
import { Rename } from './user/Rename'
import { ChangeBirthday } from './user/ChangeBirthday'
import { Fraksperre } from './user/Fraksperre'
import { NvhxBan } from './nvhx/NvhxBan'
import { Give } from './user/Give'
import { Resetpos } from './user/Resetpos'
import { Setjob } from './user/Setjob'
import { TeamNote } from './user/TeamNote'
import { Kick } from './user/Kick'
import { Lizenz } from './user/Lizenz'
import { Revive } from './user/Revive'
import { Versicherung } from './cars/Versicherung'
import { RequestToSupport } from './user/RequestToSupport'
import { BotStats } from './system/BotStats'

export class CommandHandler {
    static commands: {
        cmd: Command
        scb:
            | SlashCommandBuilder
            | SlashCommandSubcommandsOnlyBuilder
            | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    }[] = []
    static prodCommands: string[] = []
    static devCommands: string[] = []

    static async onInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return
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
        new Help()
        new ServerStatus()

        new WhoIs()

        new RequestToSupport() //Funktionsfähig RCON

        new Nvhx() //Funktionsfähig RCON
        new NvhxBan() //Funktionsfähig RCON

        new ChangeBirthday() //Funktionsfähig
        new Rename() //Funktionsfähig
        new Fraksperre() //Funktionsfähig
        new Give() //Funktionsfähig RCON

        new Kick() //Funktionsfähig RCON
        new Revive() //Funktionsfähig RCON
        new Resetpos() //Funktionsfähig
        new Setjob() //Funktionsfähig RCON
        new Lizenz() // Funktionsfähig

        new CheckImageOwner()
        new SchufaCheck()

        new Rechnung()
        // Wahl
        new Wahl()
        new TeamNote()
        // Car Commands
        // new Versicherung()
        new BotStats()
        LogManager.info('CommandManager: All commands initialized!')
        LogManager.info('Commands [PROD]:', CommandHandler.prodCommands)
        LogManager.info('Commands [DEV]:', CommandHandler.devCommands)
    }
}

export const RegisterCommand = (
    scb:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
    cmd: Command,
) => {
    if (cmd.RunEnvironment === EENV.PRODUCTION) CommandHandler.prodCommands.push(scb.name)
    if (cmd.RunEnvironment === EENV.DEVELOPMENT) CommandHandler.devCommands.push(scb.name)
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
