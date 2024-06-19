import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RconClient } from '@prism/class/RconClient';
import { RegisterCommand, RegisterEvent } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ItemService } from '@prism/services/ItemService';
import { ChatInputCommandInteraction, Events, SlashCommandBuilder } from 'discord.js';
import { ArgsOf } from '@prism/types/PrismTypes';
import LogManager from '@prism/manager/LogManager';
import { WeaponService } from '@prism/services/WeaponService';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('give')
        .setDescription('Befehle zur Fraksperre')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('item')
                .setDescription('Gib einem Spieler ein Item')
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('item')
                        .setDescription('Itemname')
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addIntegerOption((option) =>
                    option.setName('anzahl').setDescription('Anzahl der Items').setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('weapon')
                .setDescription('Gib einem Spieler eine Waffe')
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('waffe')
                        .setDescription('Waffenname')
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addIntegerOption((option) =>
                    option.setName('munition').setDescription('Anzahl der Munition (Default: 300)'),
                ),
        ),
)
export class Give extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,

            Config.Groups.PROD.BOT_DEV,
        ];
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'item') {
            await this.giveItem(interaction);
        } else if (interaction.options.getSubcommand() === 'weapon') {
            await this.giveWeapon(interaction);
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
        }
    }

    private async giveItem(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        const item = interaction.options.getString('item', true);
        const anzahl = interaction.options.getInteger('anzahl', true);

        const validateitem = await ItemService.validateItemName(item);
        await RconClient.sendCommand(`giveitem ${id} ${validateitem} ${anzahl}`);
        await this.replyWithEmbed({
            description: `Spieler ${id} sollte ${anzahl}x ${validateitem} erhalten haben!`,
        });
    }

    @RegisterEvent(Events.InteractionCreate)
    async autocompleteItemName([interaction]: ArgsOf<Events.InteractionCreate>): Promise<void> {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused(true);
        if (focusedValue.name !== 'item') return;

        const items = await ItemService.getAllItems();

        if (items instanceof Error) {
            LogManager.error(items.message);
            return;
        }

        let filtered;
        if (focusedValue.value) {
            filtered = items.filter(
                (choice) =>
                    choice.name.toLowerCase().includes(focusedValue.value.toLowerCase()) ||
                    choice.label.toLowerCase().includes(focusedValue.value.toLowerCase()),
            );
        } else {
            filtered = items;
        }
        await interaction.respond(
            filtered
                .map((item) => ({
                    name: `${item.label} (${item.name})`,
                    value: item.name,
                }))
                .slice(0, 25),
        );
    }

    private async giveWeapon(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        const waffe = interaction.options.getString('waffe', true);
        let munition = interaction.options.getInteger('munition') ?? 300;

        if (munition > 300) {
            munition = 300;
        }
        const validateWeapon = await WeaponService.validateWeaponName(waffe);
        if (!validateWeapon) {
            await this.replyError('Waffe nicht gefunden!');
            return;
        }
        const response = await RconClient.sendCommand(
            `giveweapon ${id} ${validateWeapon} ${munition}`,
        );
        if (response.includes('Invalid weapon')) {
            await this.replyError('Waffe existiert nicht!');
            return;
        }
        if (response.includes('Player already has that weapon')) {
            await this.replyError('Spieler hat diese Waffe bereits!');
            return;
        }
        await this.replyWithEmbed({
            description: `Spieler ${id} sollte ${validateWeapon} mit ${munition} Munition erhalten haben!`,
        });
    }

    @RegisterEvent(Events.InteractionCreate)
    async autocompleteWeaponName([interaction]: ArgsOf<Events.InteractionCreate>): Promise<void> {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused(true);
        if (focusedValue.name !== 'waffe') return;

        const weapons = await WeaponService.getAllWeapons();

        if (weapons instanceof Error) {
            LogManager.error(weapons.message);
            return;
        }

        let filtered;
        if (focusedValue.value) {
            filtered = weapons.filter(
                (choice) =>
                    choice.name.toLowerCase().includes(focusedValue.value.toLowerCase()) ||
                    choice.label.toLowerCase().includes(focusedValue.value.toLowerCase()),
            );
        } else {
            filtered = weapons;
        }
        await interaction.respond(
            filtered
                .map((weapon) => ({
                    name: `${weapon.label} (${weapon.name})`,
                    value: weapon.name,
                }))
                .slice(0, 25),
        );
    }
}
