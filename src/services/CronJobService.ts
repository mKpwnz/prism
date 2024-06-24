import Config from '@prism/Config';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import TxAdminError from '@prism/error/TxAdmin.error';
import LogManager from '@prism/manager/LogManager';
import { PhonePhotosService } from '@prism/services/PhonePhotosService';
import { PhoneService } from '@prism/services/PhoneService';
import { getEmbedBase, sendToChannel } from '@prism/utils/DiscordHelper';
import { PlayerService } from './PlayerService';

export class CronJobService {
    public static async banPlayersWithIllegalPhoto() {
        if (Config.ENV.NODE_ENV === 'development') {
            LogManager.debug(
                'CronJobs: banPlayersWithIllegalPhoto() will only execute in production & staging.',
            );
            return;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1000);
        const endDate = new Date();

        const illegalPhotos = await PhonePhotosService.checkPhotos(startDate, endDate);
        const illegalPhoneImageOwnerMap = new Map<string, string[]>();

        await Promise.all(
            illegalPhotos.map(async (photo) => {
                const phoneOwner = await PhoneService.getMediaCreatorByLink(photo.link);
                if (!phoneOwner) {
                    LogManager.error(
                        `Could not find the owner of the photo with the link ${photo.link}!`,
                    );
                    return;
                }

                if (!illegalPhoneImageOwnerMap.has(phoneOwner.steamID)) {
                    illegalPhoneImageOwnerMap.set(phoneOwner.steamID, [photo.link]);
                } else {
                    illegalPhoneImageOwnerMap.get(phoneOwner.steamID)?.push(photo.link);
                }
            }),
        );
        if (illegalPhoneImageOwnerMap.size === 0) {
            LogManager.debug(
                'CronJobs: banPlayersWithIllegalPhoto() done. No illegal photos found.',
            );
            return;
        }

        const banReason = 'Bug Abuse (Custom Image Upload)';
        for (const [steamID, links] of illegalPhoneImageOwnerMap) {
            const vPlayer = await PlayerService.validatePlayer(steamID);

            if (!vPlayer) {
                LogManager.error(
                    `CronJobs: banPlayersWithIllegalPhoto() failed to find the player with the identifier ${steamID}.`,
                );
                return;
            }
            const playerInfo = await TxAdminClient.getPlayerInfo(vPlayer);
            if (playerInfo instanceof TxAdminError) {
                LogManager.error(
                    `Fehler beim Abrufen der Spielerinformationen: \`${playerInfo.message}\``,
                );
                return;
            }
            await PhonePhotosService.deletePictures(links);
            const ban = await TxAdminClient.playerBan(vPlayer, banReason, 'permanent');

            if (ban instanceof TxAdminError) {
                LogManager.error(`Fehler beim Bannen des Spielers: \`${ban.message}\``);
                return;
            }

            const embed = getEmbedBase({
                title: 'TxAdmin Ban',
                description: `**SteamID:** \`${vPlayer.identifiers.steam}\`\n **Dauer:** \`permanent\`\n **Grund:** \`Bug Abuse (Custom Image Upload)\`\n`,
                color: EEmbedColors.SUCCESS,
                fields: [
                    {
                        name: 'Anzeige Name',
                        value: playerInfo.player.displayName,
                        inline: true,
                    },
                    {
                        name: 'Beitrittsdatum',
                        value: new Date((playerInfo.player.tsJoined ?? 0) * 1000).toLocaleString(
                            'de-DE',
                        ),
                        inline: true,
                    },
                    { name: '\u200B', value: '\u200B', inline: true },
                    {
                        name: 'Letzte Verbindung',
                        value: new Date(
                            (playerInfo.player.tsLastConnection ?? 0) * 1000,
                        ).toLocaleString('de-DE'),
                        inline: true,
                    },
                    {
                        name: 'BanID',
                        value: ban,
                        inline: true,
                    },
                    { name: '\u200B', value: '\u200B', inline: true },
                    {
                        name: 'Ban Grund',
                        value: `\`\`\`${banReason}\`\`\``,
                    },
                    {
                        name: 'Anzahl verbotene Bilder',
                        value: `\`\`\`${links.length}\`\`\``,
                    },
                    {
                        name: 'Identifier',
                        value: `\`\`\`${playerInfo.player.ids.join('\n')}\`\`\``,
                    },
                ],
            });

            await sendToChannel(embed, Config.Channels.PROD.S1_CUSTOM_IMAGE_BANLIST);
            await sendToChannel(embed, Config.Channels.PROD.S1_NVHX_BANS);
        }
    }
}
