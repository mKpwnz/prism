import Config from '@prism/Config';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import TxAdminError from '@prism/error/TxAdmin.error';
import { ISocietyFinanceResponse } from '@prism/interfaces/ISocietyFinanceResponse';
import LogManager from '@prism/manager/LogManager';
import { PhonePhotosService } from '@prism/services/PhonePhotosService';
import { PhoneService } from '@prism/services/PhoneService';
import { BotDB, GameDB } from '@prism/sql/Database';
import { IPhoneOwnerResponse, IPhonePhotos } from '@prism/sql/schema/Phone.schema';
import { getEmbedBase, sendToChannel } from '@prism/utils/DiscordHelper';
import axios from 'axios';
import { PlayerService } from './PlayerService';

export class CronJobService {
    public static async logSocietyFinance() {
        if (Config.ENV.NODE_ENV !== 'production') {
            LogManager.debug('CronJobs: logSocietyFinance() will only execute in production.');
            return;
        }

        const [data] = await GameDB.query<ISocietyFinanceResponse[]>(
            `
            SELECT
                j.name AS job,
                aad.money AS bank,
                j.black_money AS black,
                j.money AS money,
                j.label AS label
            FROM jobs AS j
            JOIN addon_account_data AS aad ON aad.account_name = CONCAT('society_', j.name);
            `,
        );
        await BotDB.society_finance.createMany({
            data: [...data],
        });
        LogManager.debug('CronJobs: logSocietyFinance() done.');
    }

    public static async logPlayerCount() {
        if (Config.ENV.NODE_ENV !== 'production') {
            LogManager.debug('CronJobs: logPlayerCount() will only execute in production.');
            return;
        }
        const playerArray = await PlayerService.getAllLivePlayers();
        await BotDB.player_count.create({
            data: {
                count: playerArray.length,
            },
        });
        LogManager.debug('CronJobs: logPlayerCount() done.');
    }

    public static async txAdminAuthenticate() {
        await TxAdminClient.authenticate();
        LogManager.log('CronJobs: txAdminAuthenticate() done.');
    }

    // TODO: Die Bans werden alle 30 Minuten wiederholt => Kommt durch das nicht löschen der Bilder
    // TODO: Die Bilder werden nicht automatisch gelöscht => sollten gelöscht werden
    // TODO: Wenn eine Person Mehrere Bilder hochgeladen hat, wird sie mehrfach gebannt => Sollte nur 1x
    public static async banPlayersWithIllegalPhoto() {
        // if (Config.ENV.NODE_ENV !== 'production') {
        //     LogManager.debug(
        //         'CronJobs: banPlayersWithIllegalPhoto() will only execute in production.',
        //     );
        //     return;
        // }

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

    public static async checkDeadImages() {
        const [pictures] = await GameDB.query<IPhonePhotos[]>('SELECT * FROM phone_photos');
        const res = await CronJobService.checkLinks(
            pictures
                .filter((pic) => {
                    try {
                        const url = new URL(pic.link);
                        return (
                            url.hostname.endsWith('.discordapp.com') &&
                            url.pathname.startsWith('/attachments') &&
                            !url.searchParams.has('ex')
                        );
                    } catch (e) {
                        // Ignorieren Sie Links, die keine gültige URL sind
                        return false;
                    }
                })
                .map((picture) => picture.link),
        );
        const unavailableCount = res.filter((result) => !result.available).length;
        const total = res.length;
        const unavailablePercentage = (unavailableCount / total) * 100;
        LogManager.info(`Percentage of unavailable pictures: ${unavailablePercentage.toFixed(2)}%`);
        let deletedCount = 0;
        for (const result of res) {
            if (!result.available) {
                LogManager.info(
                    `Deleting ${result.link} (${deletedCount + 1}/${unavailableCount})...`,
                );
                deletedCount++;
                await PhonePhotosService.deletePicture(result.link);
            }
        }
        LogManager.info(`Deleted ${deletedCount} images`);
    }

    static async checkLinks(links: string[]): Promise<{ link: string; available: boolean }[]> {
        const batchSize = 10;
        let checkedCount = 0;
        const total = links.length;
        const availableLinks: { link: string; available: boolean }[] = [];

        LogManager.info(`Checking ${total} links...`);

        for (let i = 0; i < links.length; i += batchSize) {
            const batch = links.slice(i, i + batchSize);
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            const promises = batch.map((link) =>
                axios
                    .get(link)
                    .then(() => {
                        checkedCount++;
                        return { link, available: true };
                    })
                    .catch(() => {
                        checkedCount++;
                        return { link, available: false };
                    }),
            );

            const results = await Promise.allSettled(promises);
            const successfulResults = results
                .filter((result) => result.status === 'fulfilled')
                .map(
                    (result) =>
                        (result as PromiseFulfilledResult<{ link: string; available: boolean }>)
                            .value,
                );
            availableLinks.push(...successfulResults);

            LogManager.info(`Checked ${checkedCount}/${total}`);
        }

        return availableLinks;
    }
}
