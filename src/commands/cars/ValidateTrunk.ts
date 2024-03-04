import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import { ItemService } from '@prism/services/ItemService';
import { VehicleService } from '@prism/services/VehicleService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('validatetrunk')
        .setDescription('Validiere den Inhalt eines Kofferraums')
        .addStringOption((option) =>
            option
                .setName('plate')
                .setDescription('Das Kennzeichen des Fahrzeugs')
                .setRequired(true),
        ),
)
export class ValidateTrunk extends Command {
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

    private static async getScuffedItemsFromTrunk(
        trunk: string,
    ): Promise<{ item: string; count: number }[]> {
        const trunkObject = JSON.parse(trunk);
        const scuffedItems: { item: string; count: number }[] = [];
        const ignoreList = ['c_money_cash', 'c_money_black', 'weapon_weapons'];
        for (const item of Object.keys(trunkObject)) {
            if (!ignoreList.includes(item)) {
                const found = await ItemService.doesItemExists(item);
                if (!found) {
                    scuffedItems.push({ item, count: trunkObject[item] });
                }
            }
        }
        return scuffedItems;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate', true);

        const vehicle = await VehicleService.getVehicleByPlate(plate);
        if (vehicle instanceof Error) {
            await this.replyError(vehicle.message);
            return;
        }

        if (!vehicle.kofferraum) {
            await this.replyWithEmbed({
                description: `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${vehicle.plate}\` ist leer.`,
            });
            return;
        }

        const scuffedItems: { item: string; count: number }[] =
            await ValidateTrunk.getScuffedItemsFromTrunk(vehicle.kofferraum);

        if (scuffedItems.length) {
            await this.replyWithEmbed({
                description: `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${
                    vehicle.plate
                }\` ist nicht valid.\nFolgende Items sind nicht mehr im Spiel:\n\`\`\`${scuffedItems
                    .map((itm) => `${itm.item} (${itm.count})`)
                    .join('\n')}\`\`\``,
                color: EEmbedColors.ALERT,
            });
            return;
        }

        await this.replyWithEmbed({
            description: `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${vehicle.plate}\` ist valid.`,
            color: EEmbedColors.SUCCESS,
        });
    }
}
