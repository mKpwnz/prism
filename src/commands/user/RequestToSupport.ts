import Config from '@Config';
import Command from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
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
)
export class RequestToSupport extends Command {
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
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const anzeigen = interaction.options.getBoolean('anzeigen', true);
        const spielerid = interaction.options.getInteger('spielerid', true);
        const nachricht = interaction.options.getString('nachricht');
        if (!spielerid) {
            this.replyError('Bitte gib eine SpielerID an!');
            return;
        }
        const anzeigenInt = anzeigen ? 1 : 0;

        let des = `Bei dem Spieler mit der ID **${spielerid}** wird die "Request To Support" Meldung **${
            anzeigen ? 'Angezeigt' : 'Ausgeblendet'
        }**!`;

        if (nachricht) {
            des += `\n\nNachricht an den Spieler:\n\`\`\`${nachricht}\`\`\``;
        }
        await RconClient.sendCommand(
            `rts ${spielerid} ${anzeigenInt} ${nachricht ? `"${nachricht}"` : ''}`,
        );
        await this.replyWithEmbed({ description: des });
    }
}
