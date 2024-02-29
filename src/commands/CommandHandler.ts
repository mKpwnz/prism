import { Command } from '@class/Command';
import {
    ChangePlate,
    DeleteTrunk,
    DeleteVehicle,
    GiveCar,
    Vehicle,
    VehiclePop,
} from '@commands/cars';
import { EENV } from '@enums/EENV';
import LogManager from '@manager/LogManager';
import {
    Client,
    Interaction,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { RestartDropbox, ValidateTrunk } from './cars';
import { ChangeHouseOwner, GetHouse, SchufaCheck } from './housing';
import { Nvhx, NvhxBan } from './nvhx';
import { CheckImageOwner, CheckPhotos, Darkchat, DeletePhone } from './phone';
import { BotStats, Help, Issue, Ping, SysInfo, TestCommand, Wahl } from './system';
import { Tebex } from './tebex';
import {
    ChangeBirthday,
    Fraksperre,
    Give,
    IsOnline,
    Kick,
    License,
    Rechnung,
    Rename,
    RequestToSupport,
    Resetpos,
    Revive,
    SchufaAuskunft,
    Setjob,
    TeamNote,
    WhoIs,
} from './user';
import { Ban, TxHistory, TxInfo, Whitelist } from './txadmin';

export class CommandHandler {
    static commands: {
        cmd: Command;
        scb:
            | SlashCommandBuilder
            | SlashCommandSubcommandsOnlyBuilder
            | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    }[] = [];

    static prodCommands: string[] = [];

    static devCommands: string[] = [];

    static async onInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        for (const command of CommandHandler.commands) {
            if (command.scb.name === interaction.commandName) {
                await command.cmd.run(interaction);
            }
        }
    }

    static initAll(client: Client) {
        LogManager.info('CommandManager: Initializing all commands...');
        // System Commands
        new Ping();
        new Help();

        new RestartDropbox();

        new WhoIs();

        new RequestToSupport(); // Funktionsfähig RCON

        new Nvhx(); // Funktionsfähig RCON
        new NvhxBan(); // Funktionsfähig RCON

        new DeletePhone();
        new CheckPhotos();
        new Darkchat();

        new ChangeBirthday(); // Funktionsfähig
        new Rename(); // Funktionsfähig
        new Fraksperre(); // Funktionsfähig
        new Give(); // Funktionsfähig RCON

        new Kick(); // Funktionsfähig RCON
        new Revive(); // Funktionsfähig RCON
        new Resetpos(); // Funktionsfähig
        new Setjob(); // Funktionsfähig RCON
        new License(); // Funktionsfähig

        new CheckImageOwner();
        new SchufaCheck();
        new ChangeHouseOwner();
        new GetHouse();
        new IsOnline();

        new Rechnung();

        new Wahl();

        new TeamNote();

        new ValidateTrunk();
        new SchufaAuskunft();
        // Car Commands
        new GiveCar();
        new VehiclePop();
        new DeleteTrunk();
        new DeleteVehicle();
        new ChangePlate();
        new Vehicle();
        new Tebex();
        // new Versicherung()
        new SysInfo();
        new BotStats();

        new Issue(client);

        new TestCommand();
        new Ban();
        new TxInfo();
        new TxHistory();
        new Whitelist();
        LogManager.info('CommandManager: All commands initialized!');
        // LogManager.info('Commands [PROD]:', CommandHandler.prodCommands);
        // LogManager.info('Commands [DEV]:', CommandHandler.devCommands);
    }
}

export function RegisterCommand(
    scb:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
    cmd: Command,
) {
    if (cmd.RunEnvironment === EENV.PRODUCTION) CommandHandler.prodCommands.push(scb.name);
    if (cmd.RunEnvironment === EENV.DEVELOPMENT) CommandHandler.devCommands.push(scb.name);
    CommandHandler.commands.push({
        cmd,
        scb,
    });
    // LogManager.debug({
    //     command: scb.name,
    //     description: scb.description,
    //     usePermissions: cmd.CheckPermissions,
    //     allowedChannels: cmd.AllowedChannels,
    //     allowedGroups: cmd.AllowedGroups,
    // });
}
