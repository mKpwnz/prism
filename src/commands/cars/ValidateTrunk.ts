import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { Items } from '@controller/Item.controller';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import Config from '@Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Helper } from '@utils/Helper';
import { VehicleRepository } from '@sql/repositories/vehicle.repository';

export class ValidateTrunk extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
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
                .setName('validatetrunk')
                .setDescription('Validiere den Inhalt eines Kofferraums')
                .addStringOption((option) =>
                    option
                        .setName('plate')
                        .setDescription('Das Kennzeichen des Fahrzeugs')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction).setTitle('Validiere Kofferraum');

        const plate = options.getString('plate');

        // @TODO Do we really need this check? Can this happen? I think Discord will prevent empty strings.
        if (!plate) {
            embed.setDescription(`Bitte gebe ein Kennzeichen an.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        // @TODO Maybe we could move Input Validation & Retrieval to a separate class & Create custom return types?
        const formattedPlate: string = Helper.formatNumberplate(plate);
        const vehicle = await VehicleRepository.getVehicleByNumberplate(formattedPlate);

        if (!vehicle) {
            // @TODO throw new VehicleNotFoundError(plate); & catch in CommandInteractionErrorHandler.
            // @TODO Or await replyWithEmbed(description); & return;
            embed.setDescription(
                `Es konnte kein Fahrzeug mit dem Kennzeichen ${plate} gefunden werden.`,
            );
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!vehicle.kofferraum) {
            embed.setDescription(
                `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${vehicle.plate}\` ist leer.`,
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const scuffedItems: { item: string; count: number }[] =
            await ValidateTrunk.getScuffedItemsFromTrunk(vehicle.kofferraum);

        if (!scuffedItems.length) {
            embed.setColor(EEmbedColors.SUCCESS);
            embed.setDescription(
                `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${vehicle.plate}\` ist valid.`,
            );
            await interaction.reply({
                embeds: [embed],
            });
        } else {
            embed.setColor(EEmbedColors.ALERT);
            embed.setDescription(
                `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${
                    vehicle.plate
                }\` ist nicht valid.\nFolgende Items sind nicht mehr im Spiel:\n\`\`\`${scuffedItems
                    .map((itm) => `${itm.item} (${itm.count})`)
                    .join('\n')}\`\`\``,
            );
            await interaction.reply({ embeds: [embed] });
        }
        // Error Handling should be done a level higher, where .execute is called.
        // Here we should only catch very specific errors.
    }

    private static async getScuffedItemsFromTrunk(
        trunk: string,
    ): Promise<{ item: string; count: number }[]> {
        const trunkObject = JSON.parse(trunk);
        // @TODO why can there be scuffed items? What does it mean exactly?
        const scuffedItems: { item: string; count: number }[] = [];
        const ignoreList = ['c_money_cash', 'c_money_black', 'weapon_weapons'];
        for (const item of Object.keys(trunkObject)) {
            if (!ignoreList.includes(item)) {
                const found = await Items.doesItemExists(item);
                if (!found) {
                    scuffedItems.push({ item, count: trunkObject[item] });
                }
            }
        }
        return scuffedItems;
    }
}
