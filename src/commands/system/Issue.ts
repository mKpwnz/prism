import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { EmoteManager } from '@manager/EmoteManager';
import LogManager from '@utils/Logger';
import axios from 'axios';
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    Client,
    Events,
    Interaction,
    Message,
    MessageReaction,
    ModalBuilder,
    PartialMessage,
    PartialMessageReaction,
    PartialUser,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
    User,
} from 'discord.js';

export class Issue extends Command {
    constructor(client: Client) {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Channels.DEV.PRISM_TESTING_2];
        this.AllowedGroups = [Config.Groups.DEV.BOTTEST];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('issue')
                .setDescription('Erzeuge ein neues Issue für die Entwickler.'),
            this,
        );
        client.on(Events.InteractionCreate, async (interaction) => this.onInteract(interaction));
        client.on(Events.MessageReactionAdd, async (reaction, user) =>
            this.onReact(reaction, user),
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('issue')
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

    async onInteract(interaction: Interaction) {
        if (interaction.isModalSubmit() && interaction.customId === 'issue') {
            const title = interaction.fields.getTextInputValue('issueTitle');
            const description = interaction.fields.getTextInputValue('issueDescription');
            const attachments = interaction.fields.getTextInputValue('issueAttachments') ?? 'Keine';

            const embed = Command.getEmbedBase({
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
                        name: 'Teamler',
                        value: `${interaction.user.displayName}`,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: `Nicht Bearbeitet`,
                        inline: true,
                    },
                ],
            });

            if (interaction.channel && interaction.channel.isTextBased()) {
                const embedMessage = await interaction.channel.send({ embeds: [embed] });
                await embedMessage.startThread({ name: `Issue: ${title}` });

                await interaction.reply({ content: 'Dein Issue wurde erstellt.', ephemeral: true });

                const emoteAccept = EmoteManager.getEmote('pbot_accept');
                const emoteDeny = EmoteManager.getEmote('pbot_deny');
                const emoteDivide = EmoteManager.getEmote('pbot_divide');
                const emotePrioSehrNiedrig = EmoteManager.getEmote('pbot_prio_sehr_niedrig');
                const emotePrioNiedrig = EmoteManager.getEmote('pbot_prio_niedrig');
                const emotePrioNormal = EmoteManager.getEmote('pbot_prio_normal');
                const emotePrioHoch = EmoteManager.getEmote('pbot_prio_hoch');
                const emotePrioSehrHoch = EmoteManager.getEmote('pbot_prio_sehr_hoch');
                const emotePrioKritisch = EmoteManager.getEmote('pbot_prio_kritisch');

                if (emoteAccept) await embedMessage.react(emoteAccept);
                if (emoteDeny) await embedMessage.react(emoteDeny);
                if (emoteDivide) await embedMessage.react(emoteDivide);
                if (emotePrioSehrNiedrig) await embedMessage.react(emotePrioSehrNiedrig);
                if (emotePrioNiedrig) await embedMessage.react(emotePrioNiedrig);
                if (emotePrioNormal) await embedMessage.react(emotePrioNormal);
                if (emotePrioHoch) await embedMessage.react(emotePrioHoch);
                if (emotePrioSehrHoch) await embedMessage.react(emotePrioSehrHoch);
                if (emotePrioKritisch) await embedMessage.react(emotePrioKritisch);
            } else {
                await this.replyError('Es ist ein Fehler aufgetreten.');
            }
        }
    }

    async onReact(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
    ): Promise<void> {
        const allowedManagementGroups = [
            Config.Groups.PROD.TEAM_INHABER,
            Config.Groups.PROD.TEAM_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_STLV_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_SERVERLEITUNG,
            Config.Groups.PROD.TEAM_HEAD_DEVELOPER,
            Config.Groups.PROD.TEAM_SERVER_ENGINEER,

            Config.Groups.DEV.BOTTEST,
        ];

        if (user.bot) return;
        const message = !reaction.message.author
            ? await reaction.message.fetch()
            : reaction.message;

        if (!message.author?.bot) return;
        if (!message.guild) return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                LogManager.error('Something went wrong when fetching the message:', error);
                return;
            }
        }
        if (!message.channel.isTextBased()) return;
        if (!message.embeds[0]) return;
        if (
            message.channelId !== Config.Channels.DEV.PRISM_TESTING_2 &&
            message.channelId !== Config.Channels.PROD.TEAM_DEV_TODO
        )
            return;
        const userRoleCache = message.guild.members.cache.get(user.id);
        await message.reactions.resolve(reaction as MessageReaction).users.remove(user.id);

        if (!allowedManagementGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID)))
            return;

        if (reaction.emoji.name) {
            switch (reaction.emoji.name) {
                case 'pbot_accept':
                    await this.acceptIssue(message, user, true);
                    break;
                case 'pbot_deny':
                    await this.acceptIssue(message, user, false);
                    break;
                case 'pbot_prio_sehr_niedrig':
                    await this.updateIssuePriority(message, 'Sehr Niedrig');
                    break;
                case 'pbot_prio_niedrig':
                    await this.updateIssuePriority(message, 'Niedrig');
                    break;
                case 'pbot_prio_normal':
                    await this.updateIssuePriority(message, 'Normal');
                    break;
                case 'pbot_prio_hoch':
                    await this.updateIssuePriority(message, 'Hoch');
                    break;
                case 'pbot_prio_sehr_hoch':
                    await this.updateIssuePriority(message, 'Sehr Hoch');
                    break;
                case 'pbot_prio_kritisch':
                    await this.updateIssuePriority(message, 'Kritisch');
                    break;
                default:
            }
        }
    }

    async updateIssuePriority(
        message: Message<boolean> | PartialMessage,
        priority: string,
    ): Promise<void> {
        const embed = message.embeds[0];
        if (!embed) return;
        const priorityIndex = embed.fields.findIndex((field) => field.name === 'Priorität');
        embed.fields[priorityIndex].value = priority;
        await message.edit({ embeds: [embed] });
    }

    async acceptIssue(
        message: Message<boolean> | PartialMessage,
        user: User | PartialUser,
        status: boolean,
    ): Promise<void> {
        const oldEmbed = message.embeds[0];
        if (!oldEmbed || !oldEmbed.title) return;
        const titleIndex = oldEmbed.fields.findIndex((field) => field.name === 'Titel');
        const descIndex = oldEmbed.fields.findIndex((field) => field.name === 'Beschreibung');
        const attachmentsIndex = oldEmbed.fields.findIndex((field) => field.name === 'Anhänge');
        const priorityIndex = oldEmbed.fields.findIndex((field) => field.name === 'Priorität');
        const statusIndex = oldEmbed.fields.findIndex((field) => field.name === 'Status');
        const teamlerIndex = oldEmbed.fields.findIndex((field) => field.name === 'Teamler');
        oldEmbed.fields[statusIndex].value = `${status ? 'Freigegeben' : 'Abgelehnt'} von <@${
            user.id
        }>`;
        const fields = [...oldEmbed.fields];

        if (status) {
            await axios
                .post(
                    `${process.env.GITLAB_ENDPOINT}projects/7/issues`,
                    {
                        title: `[API-TEST] ${
                            oldEmbed.fields[titleIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'
                        }`,
                        description: `### Eintragung für:\n${
                            fields[teamlerIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'
                        }\n\n### Beschreibung:\n${
                            fields[descIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'
                        }\n\n### Anhänge:\n${
                            fields[attachmentsIndex].value ?? '[API ERROR WHILE CREATING ISSUE]'
                        }`,
                        labels: `prio::${fields[priorityIndex].value}`,
                    },
                    {
                        headers: {
                            'PRIVATE-TOKEN': process.env.GITLAB_TOKEN,
                        },
                    },
                )
                .then(async (res) => {
                    if (fields[priorityIndex].value === 'Nicht vergeben')
                        fields[priorityIndex].value = 'Niedrig';
                    if (res.data) {
                        fields.push({
                            name: 'GitLab Issue',
                            value: `[Issue #${res.data.iid}](${res.data.web_url})`,
                        });
                    }
                    const embed = Command.getEmbedBase({
                        title: 'TODO Eintrag (Freigegeben)',
                        description: ' ',
                        fields,
                        color: EEmbedColors.SUCCESS,
                    });
                    await message.reactions.removeAll();
                    await message.edit({ embeds: [embed] });
                })
                .catch(async (error) => {
                    LogManager.error(error);
                    await message.channel.send('Es ist ein Fehler aufgetreten.');
                });
        } else {
            const embed = Command.getEmbedBase({
                title: 'TODO Eintrag (Abgelehnt)',
                description: ' ',
                fields,
                color: EEmbedColors.ALERT,
            });
            await message.reactions.removeAll();
            await message.edit({ embeds: [embed] });
        }
    }
}
