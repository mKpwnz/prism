import { Sentry } from '@prism/Bot';
import Config, { envBasedVariable } from '@prism/Config';
import S3Client from '@prism/clients/S3Client';
import { RegisterEvent } from '@prism/decorators';
import { EUniqueIdentifier } from '@prism/typings/enums/ESearchType';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { ArgsOf } from '@prism/typings/PrismTypes';
import { getEmbedBase } from '@prism/utils/DiscordHelper';
import { Helper } from '@prism/utils/Helper';
import {
    ActionRowBuilder,
    Attachment,
    ButtonBuilder,
    ButtonStyle,
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class CustomImageUpload {
    private static imageLimitations: { height: number; width: number; size: number } = {
        height: 1280,
        width: 1280,
        size: 1024 * 800,
    };

    private static channel = envBasedVariable({
        production: Config.Channels.PROD.PRISM_IMAGE_UPLOAD,
        staging: Config.Channels.STAGING.IMAGE_UPLOAD,
        development: Config.Channels.DEV.IMAGE_UPLOAD,
    });

    static async validateImage(image: Attachment | undefined) {
        const response: { success: boolean; messages: string[] } = {
            success: false,
            messages: [],
        };
        if (!image) {
            response.messages.push('Es wurde keine Datei angehängt.');
            return response;
        }
        const { height, width, size } = image;
        const url = image.url.split('?')[0];
        if (!/(.*?)\.(jpg|jpeg|webp|png)/.test(url)) {
            response.messages.push('Das Bild muss eine .jpg, .jpeg, .webp oder .png Datei sein.');
        }
        if (!height) response.messages.push('Die Höhe des Bildes konnte nicht ermittelt werden.');
        if (!width) response.messages.push('Die Breite des Bildes konnte nicht ermittelt werden.');
        if (!size)
            response.messages.push('Die Dateigröße des Bildes konnte nicht ermittelt werden.');

        if (size > this.imageLimitations.size)
            response.messages.push('Das Bild darf nicht größer als 800kb sein.');

        if (width && width > this.imageLimitations.width)
            response.messages.push(
                `Das Bild darf nicht breiter als ${this.imageLimitations.width} Pixel sein.`,
            );
        if (height && height > this.imageLimitations.height)
            response.messages.push(
                `Das Bild darf nicht höher als ${this.imageLimitations.height} Pixel sein.`,
            );

        if (response.messages.length === 0) response.success = true;
        return response;
    }

    static async uploadToS3(
        image: Attachment,
    ): Promise<{ filename: string; etag: string; version: string | null; url: string }> {
        const bucket = 'prism-phone-images';
        const formatMatch = image.name.match(/\.(png|webp|jpg|jpeg)$/i);
        const fileFormat = formatMatch ? formatMatch[1] : 'jpg';
        const newFilename = `${Helper.getUniqueId()}.${fileFormat}`;

        const data = await S3Client.uploadFromUrl(
            bucket,
            newFilename,
            {
                'Content-Type': image.contentType,
            },
            image.url,
        );
        if (!data) throw new Error('Error uploading image to S3');
        return {
            filename: newFilename,
            etag: data.etag,
            version: data.versionId,
            url: `https://${Config.ENV.MINIO_ENDPOINT}/${bucket}/${newFilename}`,
        };
    }

    static async assignImageToPlayer(url: string, phone: string, size: number): Promise<boolean> {
        try {
            const [result] = await GameDB.query<ResultSetHeader>(
                'INSERT INTO `phone_photos` (`phone_number`, `link`, `size`) VALUES (?, ?, ?)',
                [phone, url, size / 1000],
            );

            return result.affectedRows > 0;
        } catch (error) {
            Sentry.captureException(error);
            LogManager.error(error);
            return false;
        }
    }

    @RegisterEvent(Events.MessageCreate)
    async onMessage([message]: ArgsOf<Events.MessageCreate>) {
        if (message.author.bot) return;
        if (message.channelId !== CustomImageUpload.channel) return;

        const { attachments, channel } = message;

        const embed = getEmbedBase({
            title: 'Custom Image Upload',
            description: ' ',
        }).setFooter({
            text: `${message.author.displayName ?? ''}`,
            iconURL: message.author.avatarURL() ?? Config.Bot.BOT_LOGO,
        });

        if (attachments.size === 0) {
            embed.setDescription('Es wurde keine Datei angehängt.').setColor(EEmbedColors.ALERT);
            await message.reply({ embeds: [embed] });
            await message.delete();
            return;
        }
        if (attachments.size > 1) {
            embed
                .setDescription('Es wurde mehr als eine Datei angehängt.')
                .setColor(EEmbedColors.ALERT);
            await message.reply({ embeds: [embed] });
            await message.delete();
            return;
        }
        const checkingMsg = await message.reply({
            content: 'Bild wird überprüft und Hochgeladen ...',
        });
        const image = attachments.first();

        const { success, messages } = await CustomImageUpload.validateImage(image);
        if (!success) {
            embed
                .setDescription(`Es sind Fehler aufgetreten: \`\`\`${messages.join('\n')}\`\`\``)
                .setColor(EEmbedColors.ALERT);
            await channel.send({ embeds: [embed] });
            await message.delete();
            await checkingMsg.delete();
            return;
        }
        try {
            const data = await CustomImageUpload.uploadToS3(image!);
            await message.delete();
            embed.setDescription('Bild erfolgreich hochgeladen.').setColor(EEmbedColors.SUCCESS);
            const fields = [
                {
                    name: 'Dateiname',
                    value: data.filename,
                    inline: true,
                },
                {
                    name: 'Freigegeben durch',
                    value: `${message.author}`,
                    inline: true,
                },
                {
                    name: 'eTag',
                    value: `${data.etag}`,
                },
                {
                    name: 'versionId',
                    value: `${data.version}`,
                },
                {
                    name: 'Link',
                    value: data?.url,
                },
            ];
            embed.setFields(fields);
            embed.setImage(data.url);
            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('image_upload_assign_player')
                    .setLabel('Bild zuweisen')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('image_upload_delete_image')
                    .setLabel('Bild löschen')
                    .setStyle(ButtonStyle.Danger),
            );
            const resMsg = await channel.send({ embeds: [embed], components: [buttons] });
            await resMsg.startThread({
                name: `CIU
             - ${data.filename}`,
            });
            await checkingMsg.delete();
        } catch (error) {
            Sentry.captureException(error);
            LogManager.error(error);
            embed
                .setDescription(`Es gab einen Fehler beim Hochladen des Bildes.\n ${error}`)
                .setColor(EEmbedColors.ALERT);
            await channel.send({ embeds: [embed] });
            await checkingMsg.delete();
            await message.delete();
        }
    }

    @RegisterEvent(Events.InteractionCreate)
    async onInteraction([interaction]: ArgsOf<Events.InteractionCreate>) {
        const embedTemplate = getEmbedBase({
            title: 'Custom Image Upload',
            description: ' ',
        }).setFooter({
            text: `${interaction.user.displayName ?? ''}`,
            iconURL: interaction.user.avatarURL() ?? Config.Bot.BOT_LOGO,
        });

        // @TODO Bild auch von von allen Spielern löschen
        if (interaction.isButton() && interaction.customId === 'image_upload_delete_image') {
            const embed = interaction.message.embeds[0];
            if (!embed) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }
            const filename = embed.fields?.find((f) => f.name === 'Dateiname')?.value;
            if (!filename) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }
            const bucket = 'prism-phone-images';
            await S3Client.deleteFile(bucket, filename);
            await interaction.reply({ content: 'Bild wurde gelöscht.', ephemeral: true });
            await interaction.message.thread?.delete();
            await interaction.message.delete();
        }

        if (interaction.isButton() && interaction.customId === 'image_upload_assign_player') {
            const embed = interaction.message.embeds[0];
            if (!embed) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }
            const url = embed.fields?.find((f) => f.name === 'Link')?.value;
            if (!url) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }

            const phoneCiuModal = new ModalBuilder()
                .setCustomId(`phone_ciu_modal_${interaction.message.id}`)
                .setTitle('Bild zuweisen');

            const phoneCiuInPhoneNumber = new TextInputBuilder()
                .setCustomId('phone_ciu_in_phoneNumber')
                .setLabel('Telefonnummer des Spielers')
                .setStyle(TextInputStyle.Short)
                .setValue('')
                .setRequired(true);

            const phoneCiuInReason = new TextInputBuilder()
                .setCustomId('phone_ciu_in_reason')
                .setLabel(
                    `Begründung für Bild ${embed.fields?.find((f) => f.name === 'Dateiname')?.value}`,
                )
                .setStyle(TextInputStyle.Paragraph)
                .setValue('')
                .setRequired(true);

            phoneCiuModal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(phoneCiuInPhoneNumber),
                new ActionRowBuilder<TextInputBuilder>().addComponents(phoneCiuInReason),
            );

            await interaction.showModal(phoneCiuModal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('phone_ciu_modal')) {
            const phoneNumber = interaction.fields.getTextInputValue('phone_ciu_in_phoneNumber');
            const reason = interaction.fields.getTextInputValue('phone_ciu_in_reason');
            const baseMessageId = interaction.customId.split('_').at(-1);

            const url = interaction.channel?.messages.cache
                .get(baseMessageId!)
                ?.embeds[0].fields?.find((f) => f.name === 'Link')?.value;

            if (!url || !baseMessageId) {
                embedTemplate
                    .setDescription('Es ist ein Fehler aufgetreten.')
                    .setColor(EEmbedColors.ALERT);
                await interaction.reply({ embeds: [embedTemplate] });
                return;
            }

            if (!/^01726\d{5}$/.test(phoneNumber)) {
                embedTemplate
                    .setDescription('Die Telefonnummer ist nicht gültig.')
                    .setColor(EEmbedColors.ALERT);
                await interaction.reply({ embeds: [embedTemplate] });
                return;
            }

            const vPlayer = await PlayerService.validatePlayer(
                phoneNumber,
                EUniqueIdentifier.PHONENUMBER,
            );
            if (!vPlayer) {
                embedTemplate
                    .setDescription('Der Spieler konnte nicht gefunden werden!')
                    .setColor(EEmbedColors.ALERT);
                await interaction.reply({ embeds: [embedTemplate] });
                return;
            }

            embedTemplate
                .setDescription('Möchte du das Bild wirklich an den Spieler zuweisen?')
                .setColor(EEmbedColors.DEFAULT);
            const fields = [
                {
                    name: 'Telefonnummer',
                    value: phoneNumber,
                    inline: true,
                },
                {
                    name: 'Spieler',
                    value: `${vPlayer.playerdata.fullname} (${vPlayer.playerdata.phonenumber})`,
                    inline: true,
                },
                {
                    name: 'Begründung',
                    value: reason,
                },
                {
                    name: 'Thread Channel',
                    value: baseMessageId,
                    inline: true,
                },
                {
                    name: 'Link',
                    value: url,
                },
            ];
            embedTemplate.setFields(fields);

            await interaction.reply({
                embeds: [embedTemplate],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abbrechen')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`phone_ciu_assign_conf_no`),
                        new ButtonBuilder()
                            .setLabel('Zuweisen')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(`phone_ciu_assign_conf_yes`),
                    ),
                ],
            });
        }

        if (interaction.isButton() && interaction.customId === 'phone_ciu_assign_conf_no') {
            if (interaction.message) await interaction.message.delete();
        }

        if (interaction.isButton() && interaction.customId === 'phone_ciu_assign_conf_yes') {
            if (interaction.message) await interaction.message.delete();
            const embed = interaction.message.embeds[0];
            if (!embed) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }

            const phoneNumber = embed.fields?.find((f) => f.name === 'Telefonnummer')?.value;
            const playerField = embed.fields?.find((f) => f.name === 'Spieler')?.value;
            const reason = embed.fields?.find((f) => f.name === 'Begründung')?.value;
            const url = embed.fields?.find((f) => f.name === 'Link')?.value;
            const baseMessageId = embed.fields?.find((f) => f.name === 'Thread Channel')?.value;

            if (!phoneNumber || !reason || !url || !baseMessageId || !playerField) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten.',
                    ephemeral: true,
                });
                return;
            }

            const result = await CustomImageUpload.assignImageToPlayer(url, phoneNumber, 0);

            if (result) {
                const threadChannel = await interaction.channel?.messages.fetch(baseMessageId);

                const responseEmbed = getEmbedBase({
                    title: 'Custom Image Upload',
                    description: `Bild wurde erfolgreich zugewiesen.`,
                })
                    .setColor(EEmbedColors.SUCCESS)
                    .setFields([
                        { name: 'Freigegeben durch', value: `${interaction.user}` },
                        { name: 'Begründung', value: reason },
                        { name: 'Freigegeben für', value: playerField },
                    ]);

                if (threadChannel && threadChannel.thread) {
                    await threadChannel.thread?.send({
                        content: ` `,
                        embeds: [responseEmbed],
                    });
                } else {
                    await interaction.reply({
                        content: `Bild wurde erfolgreich zugewiesen.`,
                        ephemeral: true,
                        embeds: [responseEmbed],
                    });
                }
            } else {
                await interaction.reply({
                    content: `Es ist ein Fehler aufgetreten. Bitte versuche es erneut.`,
                    ephemeral: true,
                });
                await interaction.message.delete();
            }
        }
    }
}
