import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { ItemService } from '@services/ItemService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { Helper } from '@utils/helpers/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Give extends Command {
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

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('give')
                .setDescription('Befehle zur Fraksperre')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('item')
                        .setDescription('Gib einem Spieler ein Item')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option.setName('item').setDescription('Itemname').setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('anzahl')
                                .setDescription('Anzahl der Items')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('weapon')
                        .setDescription('Gib einem Spieler eine Waffe')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option.setName('waffe').setDescription('Waffenname').setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('munition')
                                .setDescription('Anzahl der Munition (Default: 300)'),
                        ),
                ),
            this,
        );
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

    // TODO: Item Liste als Autocomplete mit einbauen
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

    // TODO: Waffenliste als Choose einbauen @Micha
    private async giveWeapon(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        const waffe = interaction.options.getString('waffe', true);
        let munition = interaction.options.getInteger('munition') ?? 300;

        if (munition > 300) {
            munition = 300;
        }
        const validateWeapon = Helper.validateWeaponName(waffe);
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
}
