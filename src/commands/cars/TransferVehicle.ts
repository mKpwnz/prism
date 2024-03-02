import Config from '@Config';
import Command from '@class/Command';
import GameserverClient from '@clients/GameserverClient';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import LogManager from '@manager/LogManager';
import { VehicleService } from '@services/VehicleService';
import { ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('transfervehicle')
        .setDescription('Ändert den Standort oder Fahrzeugtypen')
        .addStringOption((option) =>
            option
                .setName('plate')
                .setDescription('Kennzeichen des Fahrzeugs')
                .setMaxLength(8)
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('newtype')
                .setDescription('Neuer Fahrzeug Typ')
                .setRequired(true)
                .addChoices(
                    { name: 'Auto (car)', value: 'car' },
                    { name: 'Flugzeug / Helikopter (air)', value: 'air' },
                    { name: 'Boot (boat)', value: 'boat' },
                ),
        )
        .addIntegerOption((option) =>
            option
                .setName('newlocation')
                .setDescription('Neuer Standort')
                .setRequired(true)
                .setAutocomplete(true),
        ),
)
export class TransferVehicle extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate', true);
        const newtype = interaction.options.getString('newtype', true);
        const newlocation = interaction.options.getInteger('newlocation', true);
        let garage = '???';
        const garages = await GameserverClient.getAllGarages();
        if (garages instanceof Error) {
            LogManager.error(garages.message);
        } else {
            garage = garages.find((g) => g.garageId === newlocation)?.DisplayName ?? '???';
        }
        if (newtype !== 'car' && newtype !== 'air' && newtype !== 'boat') {
            await this.replyError('Fahrzeugtyp nicht bekannt');
            return;
        }
        const result = await VehicleService.transferVehicle(plate, newtype, newlocation);
        if (result instanceof Error) {
            await this.replyError(result.message);
            return;
        }
        await this.replyWithEmbed({
            description: 'Fahrzeug erfolgreich angepasst!',
            fields: [
                { name: 'Kennzeichen', value: plate },
                { name: 'Neuer Standort', value: garage },
                { name: 'Neuer Typ', value: newtype },
            ],
        });
    }

    public static async autocomplete(interaction: Interaction): Promise<void> {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused(true);
        if (focusedValue.name !== 'newlocation') return;
        const newtype = interaction.options.getString('newtype') ?? '';
        const garages = await GameserverClient.getAllGarages();
        if (garages instanceof Error) {
            LogManager.error(garages.message);
            return;
        }
        let filtered;
        if (focusedValue.value) {
            filtered = garages.filter(
                (choice) =>
                    choice.DisplayName.toLowerCase().includes(focusedValue.value.toLowerCase()) ||
                    choice.VehicleType.toLowerCase().includes(focusedValue.value.toLowerCase()),
            );
        } else {
            filtered = garages.filter(
                (choice) => choice.VehicleType.toLowerCase() === newtype.toLowerCase(),
            );
        }
        await interaction.respond(
            filtered
                .map((garage) => ({
                    name: `${garage.DisplayName} - ${garage.garageId} - ${garage.VehicleType.toUpperCase()}`,
                    value: garage.garageId.toString(),
                }))
                .slice(0, 25),
        );
    }
}

