import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { ItemService } from '@services/ItemService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Give extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_LIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
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
                                .setDescription('Anzahl der Munition (Default: 250)'),
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
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        const id = options.getInteger('id');
        const item = options.getString('item');
        const anzahl = options.getInteger('anzahl');

        if (item === '' || item === null) {
            await interaction.reply({ content: 'Item darf nicht leer sein!', ephemeral: true });
            return;
        }
        const validateitem = await ItemService.validateItemName(item ?? '');
        await RconClient.sendCommand(`giveitem ${id} ${validateitem} ${anzahl}`);
        embed.setTitle('Give Item');
        embed.setDescription(`Spieler ${id} sollte ${anzahl}x ${validateitem} erhalten haben!`);
        await interaction.reply({ embeds: [embed] });
    }

    // TODO: Waffenliste als Choose einbauen @Micha
    private async giveWeapon(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        try {
            const id = options.getInteger('id');
            const waffe = options.getString('waffe') ?? '';
            let munition = options.getInteger('munition') ?? 250;
            if (munition > 250) {
                munition = 250;
            }
            const validateWeapon = Helper.validateWeaponName(waffe);
            if (validateWeapon === '') {
                await interaction.reply({ content: 'Waffe nicht gefunden!', ephemeral: true });
                return;
            }
            const response = await RconClient.sendCommand(
                `giveweapon ${id} ${validateWeapon} ${munition}`,
            );
            if (response.includes('Invalid weapon')) {
                await interaction.reply({
                    content: 'Waffe existiert nicht!',
                    ephemeral: true,
                });
                return;
            }
            if (response.includes('Player already has that weapon')) {
                await interaction.reply({
                    content: 'Spieler hat diese Waffe bereits!',
                    ephemeral: true,
                });
                return;
            }
            embed.setTitle('Give Weapon');
            embed.setDescription(
                `Spieler ${id} sollte ${validateWeapon} mit ${munition} Munition erhalten haben!`,
            );
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(
                    error,
                )}\`\`\``,
                ephemeral: true,
            });
        }
    }
}
