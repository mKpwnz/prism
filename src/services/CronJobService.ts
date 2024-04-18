import Config from '@prism/Config';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import TxAdminError from '@prism/error/TxAdmin.error';
import LogManager from '@prism/manager/LogManager';
import { PhonePhotosService } from '@prism/services/PhonePhotosService';
import { PhoneService } from '@prism/services/PhoneService';
import { IPhoneOwnerResponse } from '@prism/sql/gameSchema/Phone.schema';
import { getEmbedBase, sendToChannel } from '@prism/utils/DiscordHelper';
import { PlayerService } from './PlayerService';

export class CronJobService {
    // TODO: Die Bans werden alle 30 Minuten wiederholt => Kommt durch das nicht löschen der Bilder
    // TODO: Die Bilder werden nicht automatisch gelöscht => sollten gelöscht werden
    // TODO: Wenn eine Person Mehrere Bilder hochgeladen hat, wird sie mehrfach gebannt => Sollte nur 1x
    public static async banPlayersWithIllegalPhoto() {
        if (Config.ENV.NODE_ENV !== 'production') {
            LogManager.debug(
                'CronJobs: banPlayersWithIllegalPhoto() will only execute in production.',
            );
            return;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date();

        const illegalPhotos = await PhonePhotosService.checkPhotos(startDate, endDate);

        const phoneOwners = (
            await Promise.all(
                illegalPhotos.map(async (photo) => {
                    const phoneOwner = await PhoneService.getPhoneOwnerByImageLink(photo.link);
                    if (!phoneOwner) {
                        LogManager.error(
                            `Could not find the owner of the photo with the link ${photo.link}!`,
                        );
                        return null;
                    }
                    return phoneOwner;
                }),
            )
        ).filter((owner) => owner !== null) as IPhoneOwnerResponse[];

        if (phoneOwners.length === 0) {
            LogManager.debug(
                'CronJobs: banPlayersWithIllegalPhoto() done. No illegal photos found.',
            );
            return;
        }

        await phoneOwners.reduce(async (previousWork, owner) => {
            await previousWork;
            const banReason = 'Bug Abuse (Custom Image Upload)';

            const vPlayer = await PlayerService.validatePlayer(owner.steamID);

            if (!vPlayer) {
                LogManager.error(
                    `CronJobs: banPlayersWithIllegalPhoto() failed to find the player with the identifier ${owner.steamID}.`,
                );
                return;
            }
            const playerInfo = await TxAdminClient.getPlayerInfo(vPlayer);
            if (playerInfo instanceof TxAdminError) {
                LogManager.error(playerInfo);
                return;
            }

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
                        name: 'Identifier',
                        value: `\`\`\`${playerInfo.player.ids.join('\n')}\`\`\``,
                    },
                ],
            });

            await sendToChannel(embed, Config.Channels.PROD.S1_CUSTOM_IMAGE_BANLIST);
            await sendToChannel(embed, Config.Channels.PROD.S1_NVHX_BANS);
        }, Promise.resolve());
    }
}
