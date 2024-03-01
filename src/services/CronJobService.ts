import Config from '@Config';
import TxAdminClient from '@clients/TxAdminClient';
import { EEmbedColors } from '@enums/EmbedColors';
import TxAdminError from '@error/TxAdmin.error';
import { ISocietyFinanceResponse } from '@interfaces/ISocietyFinanceResponse';
import LogManager from '@manager/LogManager';
import { PhonePhotosService } from '@services/PhonePhotosService';
import { PhoneService } from '@services/PhoneService';
import { BotDB, GameDB } from '@sql/Database';
import { IPhoneOwnerResponse } from '@sql/schema/Phone.schema';
import { getEmbedBase, sendToChannel } from '@utils/DiscordHelper';
import { PlayerService } from './PlayerService';

export class CronJobService {
    /**
     * @description Logs the society finance to the database.
     * @author mKpwnz
     * @date 27.12.2023
     * @static
     * @memberof CronJobService
     */
    public static async logSocietyFinance() {
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

    public static async banPlayersWithIllegalPhoto() {
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

            const player = await PlayerService.validatePlayer(owner.steamID);

            if (!player) {
                LogManager.error(
                    `CronJobs: banPlayersWithIllegalPhoto() failed to find the player with the identifier ${owner.steamID}.`,
                );
                return;
            }

            const embed = getEmbedBase({
                title: 'TxAdmin Ban',
                description: `**SteamID:** \`${player.identifiers.steam}\`\n **Dauer:** \`permanent\`\n **Grund:** \`Bug Abuse (Custom Image Upload)\`\n`,
                color: EEmbedColors.SUCCESS,
            });

            const ban = await TxAdminClient.playerBan(
                player,
                'Bug Abuse (Custom Image Upload)',
                'permanent',
            );

            if (ban instanceof TxAdminError) {
                LogManager.error(`Fehler beim Bannen des Spielers: \`${ban.message}\``);
                return;
            }

            await sendToChannel(embed, Config.Channels.PROD.S1_CUSTOM_IMAGE_BANLIST);
            await sendToChannel(embed, Config.Channels.PROD.S1_NVHX_BANS);
        }, Promise.resolve());
    }
}
