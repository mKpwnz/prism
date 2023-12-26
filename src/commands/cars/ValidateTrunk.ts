import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { Items } from '@controller/Item.controller';
import { EENV } from '@enums/EENV';
import { EmbedColors } from '@enums/EmbedColors';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHelper } from '@commands/CommandHelper';

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
        const embed = this.getEmbedTemplate(interaction).setTitle('Validiere Kofferraum');
        try {
            const plate = options.getString('plate');
            // Do we really need this check?
            if (!plate) {
                embed.setDescription(`Bitte gebe ein Kennzeichen an.`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Move to game-db.service.ts
            // Is a vehicle unique to a plate?
            const [vehicles] = await GameDB.query<IVehicle[]>(
                `SELECT * FROM owned_vehicles WHERE plate = ?`,
                [Helper.validateNumberplate(plate)],
            );

            if (!vehicles.length) {
                embed.setDescription(
                    `Es konnte kein Fahrzeug mit dem Kennzeichen ${plate} gefunden werden.`,
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Is a vehicle unique to a plate?
            // Create Helper Method replyWithEmbed for these simple replies.
            const veh = vehicles[0];
            if (!veh.kofferraum) {
                embed.setDescription(
                    `Der Kofferraum des Fahrzeug mit dem Kennzeichen \`${veh.plate}\` ist leer.`,
                );
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const trunk = JSON.parse(veh.kofferraum);
            // why can there be scuffed items? What does it mean exactly?
            const scuffedItems: { item: string; count: number }[] = [];
            const ignoreList = ['c_money_cash', 'c_money_black', 'weapon_weapons'];
            for (const item of Object.keys(trunk)) {
                if (!ignoreList.includes(item)) {
                    const found = await Items.doesItemExists(item);
                    if (!found) {
                        scuffedItems.push({ item, count: trunk[item] });
                    }
                }
            }

            if (!scuffedItems.length) {
                embed.setColor(EmbedColors.SUCCESS);
                embed.setDescription(
                    `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${veh.plate}\` ist valid.`,
                );
                await interaction.reply({
                    embeds: [embed],
                });
            } else {
                embed.setColor(EmbedColors.ALERT);
                embed.setDescription(
                    `Der Kofferraum des Fahrzeugs mit dem Kennzeichen \`${
                        veh.plate
                    }\` ist nicht valid.\nFolgende Items sind nicht mehr im Spiel:\n\`\`\`${scuffedItems
                        .map((itm) => `${itm.item} (${itm.count})`)
                        .join('\n')}\`\`\``,
                );
                await interaction.reply({ embeds: [embed] });
            }
            // Error Handling should be done a level higher, where .execute is called.
            // Here we should only catch very specific errors.
        } catch (error) {
            await CommandHelper.handleInteractionError(error, interaction);
        }
    }
}
