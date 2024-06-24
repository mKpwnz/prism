import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand, RegisterEvent } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { ChatInputCommandInteraction, Events, SlashCommandBuilder } from 'discord.js';
import { BotDB } from '@prism/sql/Database';
import { commandLog } from '@prism/sql/botSchema/BotSchema';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { paginateApiResponse } from '@prism/utils/DiscordHelper';
import { ArgsOf } from '@prism/typings/PrismTypes';
import { HelpService } from '@prism/services/HelpService';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('history')
        .setDescription('Command History by User')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to get information about')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName('commandname').setDescription('Filter by Command').setAutocomplete(true),
        )
        .addStringOption((option) =>
            option
                .setName('optionsfilter')
                .setDescription(
                    'Freitext Filter für die Argumente. Bsp. eine SteamID für die ein Command ausgeführt wurde.',
                ),
        )
        .addIntegerOption((option) => option.setName('page').setDescription('Page number')),
)
export class History extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,

            Config.Groups.PROD.BOT_DEV,
        ];
        this.DoNotLog = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const user = interaction.options.getUser('user', true);
        const page = interaction.options.getInteger('page') ?? 1;
        const commandFilter = interaction.options.getString('commandname') ?? '';
        const optionFilter = interaction.options.getString('optionsfilter') ?? '';

        const history = await BotDB.select()
            .from(commandLog)
            .where(
                and(
                    eq(commandLog.user, user.id),
                    like(commandLog.command, `%${commandFilter}%`),
                    sql`${commandLog.options}::text ilike ${`%${optionFilter}%`}`,
                ),
            )
            .orderBy(desc(commandLog.id));

        if (!history.length) {
            await this.replyError('No history found for this user');
            return;
        }

        const pages = paginateApiResponse(
            history,
            (entry) => {
                const lines = [];
                const options = entry.options as { name: string; value: string }[];
                lines.push(
                    `**${entry.createdAt.toLocaleString('de-DE')}** >>> **/${entry.command}**`,
                );
                lines.push(`<#${entry.channel}>`);
                lines.push('```');
                if (options.length > 0) {
                    options.forEach((obj) => {
                        lines.push(`${obj.name}: ${obj.value}`);
                    });
                } else {
                    lines.push('No options');
                }
                lines.push('```');
                return lines.join('\n');
            },
            2000,
        );

        if (page > pages.length || page < 1) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            title: `Command History von **${user.displayName}** ( Seite ${page} von ${pages.length} )`,
            description: pages[page - 1],
        });
    }

    @RegisterEvent(Events.InteractionCreate)
    async autocompleteCommandName([interaction]: ArgsOf<Events.InteractionCreate>): Promise<void> {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused(true);
        if (focusedValue.name !== 'commandname') return;

        const commands = HelpService.getCommands();

        let filtered;
        if (focusedValue.value) {
            filtered = commands.filter((cmd) =>
                cmd.commandName.toLowerCase().includes(focusedValue.value.toLowerCase()),
            );
        } else {
            filtered = commands;
        }
        await interaction.respond(
            filtered
                .map((cmd) => ({
                    name: `${cmd.commandName}`,
                    value: cmd.commandName,
                }))
                .slice(0, 25),
        );
    }
}
