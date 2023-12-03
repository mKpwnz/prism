import { Command } from '@class/Command'
import { EENV } from '@enums/EENV'
import LogManager from '@utils/Logger'
import { Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import { ValidateTrunk } from './cars'
import { RestartDropbox } from './cars/RestartDropbox'
import { SchufaCheck } from './housing'
import { Nvhx, NvhxBan } from './nvhx'
import { CheckImageOwner, CheckPhotos } from './phone'
import { DeletePhone } from './phone/DeletePhone'
import { BotStats, CachePerformance, Help, Ping, ServerStatus, TestCommand, Wahl } from './system'
import {
    ChangeBirthday,
    Fraksperre,
    Give,
    Kick,
    Lizenz,
    Rechnung,
    Rename,
    RequestToSupport,
    Resetpos,
    Revive,
    Setjob,
    TeamNote,
    WhoIs,
} from './user'

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

        new RestartDropbox()

        new WhoIs()

        new RequestToSupport() //Funktionsfähig RCON

        new Nvhx() //Funktionsfähig RCON
        new NvhxBan() //Funktionsfähig RCON

        new DeletePhone()
        new CheckPhotos()

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

        new Wahl()

        new TeamNote()

        new ValidateTrunk()
        // Car Commands
        // new Versicherung()
        new BotStats()
        new CachePerformance()
        new TestCommand()
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
