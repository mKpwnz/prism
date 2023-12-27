import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import Config from '@Config';
import { IInsurance } from '@sql/schema/Versicherung.schema';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { InsuranceRepository } from '@sql/repositories/insurance.repository';

// @TODO unused class Versicherung
export class Insurance extends Command {
    constructor() {
        super();
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('versicherung')
                .setDescription('Befehle Rund um die Versicherung')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('prüfen')
                        .setDescription('Prüft ob ein Fahrzeug versichert ist')
                        .addStringOption((option) =>
                            option
                                .setName('kennzeichen')
                                .setDescription('Kennzeichen des Fahrzeuges')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('hinzufügen')
                        .setDescription('Fügt eine Versicherung hinzu')
                        .addStringOption((option) =>
                            option
                                .setName('kennzeichen')
                                .setDescription('Kennzeichen des Fahrzeuges')
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('dauer')
                                .setDescription('(Hinzufügen): Dauer')
                                .addChoices(
                                    { name: '1 Tag', value: 1 },
                                    { name: '3 Tage', value: 3 },
                                    { name: '7 Tage', value: 7 },
                                    { name: '14 Tage', value: 14 },
                                    { name: '30 Tage', value: 30 },
                                ),
                        )
                        .addBooleanOption((option) =>
                            option.setName('premium').setDescription('Premium Versicherung?'),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('entfernen')
                        .setDescription('Entfernt eine Versicherung')
                        .addStringOption((option) =>
                            option
                                .setName('kennzeichen')
                                .setDescription('Kennzeichen des Fahrzeuges')
                                .setRequired(true),
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;

        switch (options.getSubcommand()) {
            case 'prüfen':
                await this.checkInsurance(interaction);
                break;
            case 'hinzufügen':
                await this.addInsurance(interaction);
                break;
            case 'entfernen':
                await this.removeInsurance(interaction);
                break;
            default:
                await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
                break;
        }
    }

    private async checkInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);

        let kennzeichen = options.getString('kennzeichen');
        if (!kennzeichen) {
            await interaction.reply('Kein Kennzeichen angegeben!');
            return;
        }

        kennzeichen = Helper.formatNumberplate(kennzeichen);
        // @TODO
        // What if kennzeichen is not valid?
        // Currently we still check in sql
        // but it think it would be better to let the user know that the plate is not valid

        const versicherungen: IInsurance[] =
            await InsuranceRepository.getInsuranceByNumberplate(kennzeichen);

        if (versicherungen.length !== 1) {
            let message;
            if (versicherungen.length === 0)
                message = `Keine Versicherung für ${kennzeichen} gefunden!`;
            // @TODO why don't we show all insurances in the embed?
            else
                message = `Es wurden ${versicherungen.length} Versicherungen für ${kennzeichen} gefunden!`;
            await interaction.reply({ content: message, ephemeral: true });
            return;
        }
        const versicherung = versicherungen[0];
        embed.setTitle('Versicherung Prüfen');
        let status = '**Nicht Versichert**';
        if (versicherung.ts > new Date()) status = '**Versichert**';
        embed.addFields({
            name: versicherung.plate,
            value: `${status}\nVersichert bis: ${versicherung.ts.toLocaleDateString()} ${versicherung.ts.toLocaleTimeString()}\nPremium: ${
                versicherung.premium
            }`,
        });
        await interaction.reply({ embeds: [embed] });
    }

    private async addInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        let kennzeichen = options.getString('kennzeichen');
        if (!kennzeichen) {
            await interaction.reply('Kein Kennzeichen angegeben!');
            return;
        }
        kennzeichen = Helper.formatNumberplate(kennzeichen);

        const dauer = options.getNumber('dauer');
        if (!dauer) {
            await interaction.reply('Keine Dauer angegeben!');
            return;
        }
        const premium = options.getBoolean('premium') ?? false;

        await InsuranceRepository.addInsurance(kennzeichen, dauer, premium);

        const ts = new Date();
        ts.setDate(ts.getDate() + dauer);
        embed.setTitle('Versicherung Hinzufügen');
        embed.addFields({
            name: kennzeichen ?? 'Fehler',
            value: `Versichert bis: ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}\nPremium: ${
                premium ? 'Ja' : 'Nein'
            }`,
        });
        await interaction.reply({ embeds: [embed] });
    }

    private async removeInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);

        const plate = options.getString('kennzeichen');

        // @TODO Remove?
        if (!plate) {
            await interaction.reply('Kein Kennzeichen angegeben!');
            return;
        }

        const formattedPlate = Helper.formatNumberplate(plate);
        const versicherungen: IInsurance[] =
            await InsuranceRepository.getInsuranceByNumberplate(formattedPlate);

        if (versicherungen.length !== 1) {
            let message;
            if (versicherungen.length === 0) message = `Keine Versicherung für ${plate} gefunden!`;
            else
                message = `Es wurden ${versicherungen.length} Versicherungen für ${plate} gefunden!`;
            await interaction.reply({ content: message, ephemeral: true });
            return;
        }
        const versicherung = versicherungen[0];
        // @TODO Are we sure we want to delete every insurance for the plate?
        await InsuranceRepository.deleteVersicherungenByNumberplate(versicherung);

        embed.setTitle('Versicherung Entfernen');
        embed.addFields({
            name: plate,
            value: `Versicherung entfernt\nPremium: ${
                versicherung.premium ? 'Ja' : 'Nein'
            }\nVersichert bis: ${versicherung.ts.toLocaleDateString()} ${versicherung.ts.toLocaleTimeString()}`,
        });
        await interaction.reply({ embeds: [embed] });
    }
}
