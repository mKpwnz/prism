import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { UserService } from '@prism/services/UserService';
import { ISchufaUser } from '@prism/sql/gameSchema/User.schema';
import { attachmentFromObject } from '@prism/utils/DiscordHelper';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('schufaauskunft')
        .setDescription(
            'Gibt eine liste vom allen usern mit negativem Kontostand aus (Grüngeld, Schwarzgeld, Bank)',
        )
        .addIntegerOption((option) => option.setName('page').setDescription('Seite'))
        .addBooleanOption((option) =>
            option.setName('jsonexport').setDescription('Json Export ausgeben'),
        ),
)
export class SchufaAuskunft extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
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
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const jsonexport = interaction.options.getBoolean('jsonexport') ?? false;
        const page = interaction.options.getInteger('page') ?? 1;

        const schufaUsers: ISchufaUser[] = await UserService.getSchufaUsers();
        const attachments: AttachmentBuilder[] = [];

        const pages = await this.splitApiResponse(schufaUsers, 2000);

        if (jsonexport) {
            attachments.push(attachmentFromObject(schufaUsers, 'schufaUsers'));
        }

        await this.replyWithEmbed({
            title: `Schufa Auskunft Seite ${page} von ${pages.length}`,
            description: pages[page - 1],
            files: attachments,
        });
    }

    async splitApiResponse(schufausers: ISchufaUser[], pageSize: number): Promise<string[]> {
        const pages = [];
        let currentPage = '';
        const users: string[] = [];

        for (const user of schufausers) {
            const id = await PlayerService.getPlayerId(user.steamId);
            users.push(
                `**${user.firstname} ${user.lastname}** ( ${user.steamId} ) ${id > -1 ? `:green_circle: **ID: ${id} **` : ':red_circle: **Offine** '} \`\`\`Grüngeld: ${user.accounts.money}\nSchwarzgeld: ${user.accounts.black_money}\nBank: ${user.accounts.bank}\`\`\`\n`,
            );
        }

        for (const user of users) {
            // Überprüfe, ob die nächste Zeile hinzugefügt werden kann, ohne das Zeichenlimit zu überschreiten
            if (currentPage.length + user.length + 1 <= pageSize) {
                currentPage += `${user}\n`;
            } else {
                // Füge die aktuelle Seite zu den Seiten hinzu und beginne eine neue Seite
                pages.push(currentPage);
                currentPage = `${user}\n`;
            }
        }

        // Füge die letzte Seite hinzu, wenn vorhanden
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }
}
