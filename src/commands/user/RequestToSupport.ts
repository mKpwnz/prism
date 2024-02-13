import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class RequestToSupport extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

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
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('rts')
                .setDescription('Request to Support')
                .addBooleanOption((option) =>
                    option
                        .setName('anzeigen')
                        .setDescription('True = Anzeigen | False = Ausblenden')
                        .setRequired(true),
                )
                .addIntegerOption((option) =>
                    option.setName('spielerid').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('nachricht').setDescription('Nachricht an den Spieler'),
                ),
            this,
        );
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        embed.setTitle('Request to Support');
        try {
            const anzeigen = options.getBoolean('anzeigen');
            const spielerid = options.getInteger('spielerid');
            if (!spielerid) {
                embed.setDescription('Bitte gib eine SpielerID an!');
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
                return;
            }
            const nachricht = options.getString('nachricht');
            const anzeigenInt = anzeigen ? 1 : 0;

            let des = `Bei dem Spieler mit der ID **${spielerid}** wird die "Request To Support" Meldung **${
                anzeigen ? 'Angezeigt' : 'Ausgeblendet'
            }**!`;

            if (nachricht) {
                des += `\n\nNachricht an den Spieler:\n\`\`\`${nachricht}\`\`\``;
            }
            embed.setDescription(des);

            const command = `rts ${spielerid} ${anzeigenInt} ${nachricht ? `"${nachricht}"` : ''}`;
            await RconClient.sendCommand(command);
            await interaction.reply({
                embeds: [embed],
            });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(
                    error,
                )}\`\`\``,
                ephemeral: true,
            });
        }
    }
}
