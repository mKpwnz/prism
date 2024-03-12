import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { BotDB } from '@prism/sql/Database';
import { faResult, faScans } from '@prism/sql/botSchema/BotSchema';
import { paginateApiResponse } from '@prism/utils/DiscordHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { desc, eq } from 'drizzle-orm';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('fainfo')
        .setDescription('Financial Analytics Information')
        .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
)
export class FaInfo extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const page = interaction.options.getInteger('page') ?? 1;

        const lastScan = await BotDB.select()
            .from(faScans)
            .orderBy(desc(faScans.id))
            .limit(1)
            .then((res) => res[0]);

        const lastScanResult = await BotDB.select()
            .from(faResult)
            .where(eq(faResult.scanid, lastScan.id))
            .orderBy(desc(faResult.totalMoney));

        let sumGreenMoney = 0;
        let subBlackMoney = 0;
        for (const entry of lastScanResult) {
            const numGreen = Number(entry.totalMoney);
            const numBlack = Number(entry.totalBlack);
            if (!Number.isNaN(numGreen)) sumGreenMoney += numGreen;
            if (!Number.isNaN(numBlack)) subBlackMoney += numBlack;
        }

        const pages = paginateApiResponse(
            lastScanResult,
            (res) => {
                const lines = [];
                lines.push(`Spieler: **${res.icname}** (${res.identifier})`);

                lines.push('```');
                lines.push(`Bank: ${Number(res.bank).toLocaleString('de-DE')}€`);
                lines.push(`Cash: ${Number(res.cash).toLocaleString('de-DE')}€`);
                lines.push(`Schwarz: ${Number(res.black).toLocaleString('de-DE')}€`);
                lines.push(`KFZ Grün: ${Number(res.vehicleGreen).toLocaleString('de-DE')}€`);
                lines.push(`KFZ Schwarz: ${Number(res.vehicleBlack).toLocaleString('de-DE')}€`);
                if (res.housingGreen)
                    lines.push(`Haus: ${Number(res.housingGreen).toLocaleString('de-DE')}€`);
                if (res.immobayGreen)
                    lines.push(`Immobay: ${Number(res.immobayGreen).toLocaleString('de-DE')}€`);
                lines.push('---');
                lines.push(`Gesamt Grüngeld: ${Number(res.totalGreen).toLocaleString('de-DE')}€`);
                lines.push(
                    `Gesamt Schwarzgeld: ${Number(res.totalBlack).toLocaleString('de-DE')}€`,
                );
                lines.push('---');
                lines.push(`Gesamt Geld: ${Number(res.totalMoney).toLocaleString('de-DE')}€`);

                lines.push('```');
                return lines.join('\n');
            },
            1900,
        );

        await this.replyWithEmbed({
            title: `Financial Analytics ( Seite ${page} von ${pages.length} )`,
            description: `Letzter Scan: **${lastScan.createdAt.toLocaleString('de-DE')}**\nGesamt Grüngeld im Umlauf: **${sumGreenMoney.toLocaleString('de-DE')}€**\nGesamt Schwarzgeld im Umlauf: **${subBlackMoney.toLocaleString('de-DE')}€**\n\n${pages[page - 1]}`,
        });
    }
}
