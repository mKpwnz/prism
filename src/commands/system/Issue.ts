import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { GitlabClient } from '@prism/clients/GitlabClient';
import { RegisterCommand, RegisterEvent } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import LogManager from '@prism/manager/LogManager';
import { ArgsOf } from '@prism/typings/PrismTypes';
import { getEmbedBase } from '@prism/utils/DiscordHelper';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Events,
    Interaction,
    ModalBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Erzeuge ein neues Issue für die Entwickler.'),
)
export class Issue extends Command {
    private static allowedManagementGroups = [
        Config.Groups.PROD.TEAM_INHABER,
        Config.Groups.PROD.TEAM_PROJEKTLEITUNG,
        Config.Groups.PROD.TEAM_STLV_PROJEKTLEITUNG,
        Config.Groups.PROD.TEAM_SERVERLEITUNG,
        Config.Groups.PROD.TEAM_HEAD_DEVELOPER,
        Config.Groups.PROD.TEAM_SERVER_ENGINEER,

        Config.Groups.DEV.BOTTEST,
    ];

    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.TEAM_DEV_TODO,

            Config.Channels.STAGING.TESTING_2,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.TEAM_INHABER,
            Config.Groups.PROD.TEAM_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_STLV_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_SERVERLEITUNG,
            Config.Groups.PROD.TEAM_HEAD_DEVELOPER,
            Config.Groups.PROD.TEAM_SERVER_ENGINEER,

            Config.Groups.PROD.TEAM_SUPPORT_STAFF,
            Config.Groups.PROD.TEAM_DEVELOPER_STAFF,

            Config.Groups.DEV.BOTTEST,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('issue_submit')
            .setTitle('TODO Eintag erstellen')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueTitle')
                        .setLabel('Titel')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true),
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueDescription')
                        .setLabel('Beschreibung')
                        .setMaxLength(1000)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true),
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueAttachments')
                        .setLabel('Anhänge (Links)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false),
                ),
            );

        await interaction.showModal(modal);
    }

    @RegisterEvent(Events.InteractionCreate)
    async onInteract([interaction]: ArgsOf<Events.InteractionCreate>) {
        if (interaction.isModalSubmit() && interaction.customId === 'issue_submit') {
            if (!interaction.guildId) return;
            if (!interaction.channel || !interaction.channel.isTextBased()) return;

            const title = interaction.fields.getTextInputValue('issueTitle');
            const description = interaction.fields.getTextInputValue('issueDescription');
            const attachments = interaction.fields.getTextInputValue('issueAttachments') ?? 'Keine';

            const embed = getEmbedBase({
                title: 'TODO Eintrag (warte auf Freigabe)',
                description: ` `,
                fields: [
                    {
                        name: 'Titel',
                        value: `${title}`,
                    },
                    {
                        name: 'Beschreibung',
                        value: `${description}`,
                    },
                    {
                        name: 'Anhänge',
                        value: `${attachments || 'Keine'}`,
                    },
                    {
                        name: 'Priorität',
                        value: `Nicht vergeben`,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: `Nicht Bearbeitet`,
                        inline: true,
                    },
                ],
            }).setAuthor({
                name: `${interaction.user.displayName} | ${interaction.user.id}`,
                iconURL: interaction.user.avatarURL() ?? Config.Bot.BOT_LOGO,
            });
            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('issue_accept')
                    .setLabel('Freigeben')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('issue_deny')
                    .setLabel('Ablehnen')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('issue_edit')
                    .setLabel('Bearbeiten')
                    .setStyle(ButtonStyle.Primary),
            );
            const prioSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('issue_priority')
                    .setPlaceholder('Priorität ändern')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Sehr Niedrig')
                            .setValue('Sehr Niedrig'),
                        new StringSelectMenuOptionBuilder().setLabel('Niedrig').setValue('Niedrig'),
                        new StringSelectMenuOptionBuilder().setLabel('Normal').setValue('Normal'),
                        new StringSelectMenuOptionBuilder().setLabel('Hoch').setValue('Hoch'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Sehr Hoch')
                            .setValue('Sehr Hoch'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Kritisch')
                            .setValue('Kritisch'),
                    ),
            );

            const embedMessage = await interaction.channel.send({
                embeds: [embed],
                components: [buttons, prioSelect],
            });
            await embedMessage.startThread({ name: `Issue: ${title}` });
            await interaction.reply({ content: 'Dein Issue wurde erstellt.', ephemeral: true });
        } else if (interaction.isButton() && interaction.customId === 'issue_accept') {
            await Issue.acceptIssue(interaction, true);
            await interaction.message.edit({ components: [] });
            await interaction.reply({ content: 'Das Issue wurde freigegeben.', ephemeral: true });
        } else if (interaction.isButton() && interaction.customId === 'issue_deny') {
            await Issue.acceptIssue(interaction, false);
            await interaction.message.edit({ components: [] });
            await interaction.reply({ content: 'Das Issue wurde abgelehnt.', ephemeral: true });
        } else if (interaction.isButton() && interaction.customId === 'issue_edit') {
            await Issue.editIssue(interaction);
        } else if (interaction.isModalSubmit() && interaction.customId === 'issue_edit_submit') {
            if (!interaction.message || !interaction.message.embeds[0]) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }
            const title = interaction.fields.getTextInputValue('issueTitle');
            const description = interaction.fields.getTextInputValue('issueDescription');
            const attachments = interaction.fields.getTextInputValue('issueAttachments') ?? 'Keine';
            const oldEmbed = interaction.message.embeds[0];
            const embed = getEmbedBase({
                title: 'TODO Eintrag (warte auf Freigabe)',
                description: ` `,
                fields: [
                    {
                        name: 'Titel',
                        value: `${title}`,
                    },
                    {
                        name: 'Beschreibung',
                        value: `${description}`,
                    },
                    {
                        name: 'Anhänge',
                        value: `${attachments || 'Keine'}`,
                    },
                    {
                        name: 'Priorität',
                        value: `Nicht vergeben`,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: `Nicht Bearbeitet`,
                        inline: true,
                    },
                ],
            }).setAuthor(oldEmbed.author);
            await interaction.message.edit({ embeds: [embed] });
            await interaction.message.thread?.send({
                content: `Der TODO Eintrag wurde von ${interaction.user.displayName} bearbeitet.\nAlter eintrag:`,
                embeds: [oldEmbed],
            });
            await interaction.reply({ content: 'Dein Issue wurde bearbeitet.', ephemeral: true });
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'issue_priority') {
            await Issue.updateIssuePriority(interaction, interaction.values[0]);
            await interaction.reply({ content: 'Die Priorität wurde geändert.', ephemeral: true });
        }
    }

    static async editIssue(interaction: Interaction) {
        if (!interaction.isButton()) return;
        const { message, user } = interaction;
        if (!message.embeds[0]) return;

        const embed = message.embeds[0];
        const userRoleCache = message.guild?.members.cache.get(user.id);
        const userHasManagementRole = Issue.allowedManagementGroups.some((roleID) =>
            userRoleCache?.roles.cache.has(roleID),
        );
        const authorID = embed.author?.name.split(' ').at(-1);
        if (!userHasManagementRole && authorID !== user.id) {
            await interaction.reply({
                content: 'Du hast keine Berechtigung um diese Aktion auszuführen.',
                ephemeral: true,
            });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('issue_edit_submit')
            .setTitle('TODO Eintag bearbeiten')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueTitle')
                        .setLabel('Titel')
                        .setValue(embed.fields.find((field) => field.name === 'Titel')?.value ?? '')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true),
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueDescription')
                        .setLabel('Beschreibung')
                        .setValue(
                            embed.fields.find((field) => field.name === 'Beschreibung')?.value ??
                                '',
                        )
                        .setMaxLength(1000)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true),
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('issueAttachments')
                        .setValue(
                            embed.fields.find((field) => field.name === 'Anhänge')?.value ?? '',
                        )
                        .setLabel('Anhänge (Links)')
                        .setMaxLength(1000)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false),
                ),
            );

        await interaction.showModal(modal);
    }

    static async updateIssuePriority(interaction: Interaction, priority: string): Promise<void> {
        if (!interaction.isStringSelectMenu()) return;
        const { message, user } = interaction;
        const userRoleCache = message.guild?.members.cache.get(user.id);
        if (
            !Issue.allowedManagementGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))
        ) {
            await interaction.reply({
                content: 'Du hast keine Berechtigung um diese Aktion auszuführen.',
                ephemeral: true,
            });
            return;
        }
        const embed = message.embeds[0];
        if (!embed) return;
        const priorityIndex = embed.fields.findIndex((field) => field.name === 'Priorität');
        const statusIndex = embed.fields.findIndex((field) => field.name === 'Status');
        const oldPriority = embed.fields[priorityIndex].value;
        embed.fields[priorityIndex].value = priority;
        if (oldPriority === priority) return;
        if (embed.fields[statusIndex].value !== 'Nicht Bearbeitet') {
            await message.reactions.removeAll();
            return;
        }
        await message.thread?.send({
            content: `Priorität wurde durch **${user.displayName}** von **${oldPriority}** auf **${priority}** geändert.`,
        });
        await message.edit({ embeds: [embed] });
    }

    static async acceptIssue(interaction: Interaction, status: boolean): Promise<void> {
        if (!interaction.isButton()) return;
        const { message, user } = interaction;
        const userRoleCache = message.guild?.members.cache.get(user.id);
        if (
            !Issue.allowedManagementGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))
        ) {
            await interaction.reply({
                content: 'Du hast keine Berechtigung um diese Aktion auszuführen.',
                ephemeral: true,
            });
            return;
        }
        const Embed = message.embeds[0];
        if (!Embed || !Embed.title) return;
        const titleIndex = Embed.fields.findIndex((field) => field.name === 'Titel');
        const descIndex = Embed.fields.findIndex((field) => field.name === 'Beschreibung');
        const attachmentsIndex = Embed.fields.findIndex((field) => field.name === 'Anhänge');
        const priorityIndex = Embed.fields.findIndex((field) => field.name === 'Priorität');
        const statusIndex = Embed.fields.findIndex((field) => field.name === 'Status');
        Embed.fields[statusIndex].value = `${status ? 'Freigegeben' : 'Abgelehnt'} von <@${
            user.id
        }>`;
        const fields = [...Embed.fields];

        if (status) {
            if (fields[priorityIndex].value === 'Nicht vergeben')
                fields[priorityIndex].value = 'Niedrig';
            const description = [];
            const acceptorName = `${user.displayName} | ${user.id}`;
            description.push(`### Eintragung für:`);
            description.push(`${Embed.author?.name ?? '[API ERROR WHILE CREATING ISSUE]'}`);
            description.push(`### Freigegeben durch:`);
            description.push(`${acceptorName ?? '[API ERROR WHILE CREATING ISSUE]'}`);
            description.push(`### Beschreibung:`);
            description.push(`${fields[descIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'}`);
            description.push(`### Anhänge:`);
            description.push(`${fields[attachmentsIndex].value ?? 'Keine'}`);
            description.push(`### Thread Link:`);
            description.push(`${message.thread?.url ?? '[API ERROR WHILE CREATING ISSUE]'}`);

            GitlabClient.API.Issues.create(
                7,
                `${Embed.fields[titleIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'}`,
                {
                    description: `${description.join('\n')}`,
                    labels: `prio::${fields[priorityIndex].value}`,
                },
            )
                .then(async (response) => {
                    if (response.web_url && response.iid) {
                        fields.push({
                            name: 'GitLab Issue',
                            value: `[Issue #${response.iid}](${response.web_url})`,
                        });
                    }
                    const embed = getEmbedBase({
                        title: 'TODO Eintrag (Freigegeben)',
                        description: ' ',
                        fields,
                        color: EEmbedColors.SUCCESS,
                    }).setAuthor(Embed.author);
                    await message.reactions.removeAll();
                    await message.edit({ embeds: [embed] });
                    await message.thread?.send({
                        content: `Der TODO Eintrag wurde von ${user.displayName} Freigegeben.`,
                    });
                })
                .catch(async (error) => {
                    Sentry.captureException(error);
                    LogManager.error(error);
                    await message.channel.send('Es ist ein Fehler aufgetreten.');
                });
        } else {
            const embed = getEmbedBase({
                title: 'TODO Eintrag (Abgelehnt)',
                description: ' ',
                fields,
                color: EEmbedColors.ALERT,
            }).setAuthor(Embed.author);
            await message.reactions.removeAll();
            await message.edit({ embeds: [embed] });
            await message.thread?.send({
                content: `Der TODO Eintrag wurde von ${user.displayName} Abgelehnt.`,
            });
        }
    }
}
