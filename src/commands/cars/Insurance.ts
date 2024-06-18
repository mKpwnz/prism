import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { InsuranceService } from '@prism/services/InsuranceService';
import { executeCommandFromMap } from '@prism/utils/DiscordCommandHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
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
                        .setRequired(true)
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
)
export class Insurance extends Command {
    constructor() {
        super();
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,
            Config.Groups.PROD.BOT_DEV,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await executeCommandFromMap(interaction, {
            prüfen: () => this.checkInsurance(interaction),
            hinzufügen: () => this.addInsurance(interaction),
            entfernen: () => this.removeInsurance(interaction),
        });
    }

    private async checkInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('kennzeichen', true);

        const insurances = await InsuranceService.getInsuranceByPlate(plate);
        if (insurances instanceof Error) {
            await this.replyError(insurances.message);
            return;
        }

        const insurance = insurances[0];
        const status = insurance.ts > new Date() ? '**Versichert**' : '**Nicht Versichert**';
        await this.replyWithEmbed({
            title: 'Versicherung Prüfen',
            description: `${status}\nVersichert bis: ${insurance.ts.toLocaleDateString()} ${insurance.ts.toLocaleTimeString()}\nPremium: ${
                insurance.premium
            }`,
        });
    }

    private async addInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;

        const plate: string = options.getString('kennzeichen', true);
        const dauer: number = options.getNumber('dauer', true);
        const premium: boolean = options.getBoolean('premium') ?? false;

        const result = await InsuranceService.createInsurance(plate, dauer, premium);

        if (!result) {
            await interaction.reply({
                content: 'Fehler beim Hinzufügen der Versicherung',
                ephemeral: true,
            });
            return;
        }

        const ts = new Date();
        ts.setDate(ts.getDate() + dauer);
        await this.replyWithEmbed({
            title: 'Versicherung Hinzufügen',
            fields: [
                {
                    name: plate ?? 'Fehler',
                    value: `Versichert bis: ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}\nPremium: ${
                        premium ? 'Ja' : 'Nein'
                    }`,
                },
            ],
            description: '',
        });
    }

    private async removeInsurance(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const plate = options.getString('kennzeichen', true);

        const insurances = await InsuranceService.getInsuranceByPlate(plate);
        if (insurances instanceof Error) {
            await this.replyError(insurances.message);
            return;
        }

        const insurance = insurances[0];
        const result = await InsuranceService.deleteInsuranceByPlate(insurance.plate);
        if (result instanceof Error) {
            await this.replyError(result.message);
            return;
        }

        await this.replyWithEmbed({
            title: 'Versicherung Entfernen',
            fields: [
                {
                    name: plate,
                    value: `Versicherung entfernt\nPremium: ${
                        insurance.premium ? 'Ja' : 'Nein'
                    }\nVersichert bis: ${insurance.ts.toLocaleDateString()} ${insurance.ts.toLocaleTimeString()}`,
                },
            ],
            description: '',
        });
    }
}
