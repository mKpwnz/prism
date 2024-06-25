import {
    IPhone,
    IPhoneBackups,
    IPhoneClockAlarms,
    IPhoneDarkchatAccounts,
    IPhoneDarkchatChannels,
    IPhoneDarkchatMessages,
    IPhoneInstagramAccounts,
    IPhoneInstagramComments,
    IPhoneInstagramMessages,
    IPhoneInstagramPosts,
    IPhoneLoggedInAccounts,
    IPhoneMailAccounts,
    IPhoneMailLoggedIn,
    IPhoneMailMessages,
    IPhoneMapLocations,
    IPhoneNotes,
    IPhonePhoneBlockedNumbers,
    IPhonePhoneCalls,
    IPhonePhoneContacts,
    IPhonePhoneVoiceMails,
    IPhonePhotos,
    IPhoneSqlMediaCreatorResponse,
    IPhoneTiktokAccounts,
    IPhoneTiktokChannels,
    IPhoneTiktokComments,
    IPhoneTiktokMessages,
    IPhoneTiktokVideos,
    IPhoneTwitterAccounts,
    IPhoneTwitterMessages,
    IPhoneTwitterTweets,
    IPhoneVoiceMemoRecordings,
    IPhoneWalletTransactions,
    IPhoneYellowPagesPosts,
} from '@prism/sql/gameSchema/Phone.schema';
import { GameDB } from '@prism/sql/Database';
import { ResultSetHeader } from 'mysql2';
import { IValidatedPlayer } from '@prism/typings/interfaces/IValidatedPlayer';
import {
    IAppDataDarkchat,
    IAppDataInstagram,
    IAppDataMail,
    IAppDataTiktok,
    IAppDataTwitter,
    IAppDataYellowPages,
    IPhoneBlocked,
    IPhoneFullData,
} from '@prism/typings/interfaces/IPhone';
import { FilteredSelectorData, SelectorKeyObject } from '@prism/typings/Selector';

export class PhoneService {
    public static async getMediaCreatorByLink(
        link: string,
    ): Promise<IPhoneSqlMediaCreatorResponse | undefined> {
        const [response] = await GameDB.query<IPhoneSqlMediaCreatorResponse[]>(
            `
                SELECT u.firstname,
                       u.lastname,
                       phones.id        AS steamID,
                       photos.phone_number,
                       photos.timestamp AS img_timestamp
                FROM phone_photos photos
                         JOIN phone_phones phones ON photos.phone_number = phones.phone_number
                         JOIN users u ON u.identifier = phones.id
                WHERE photos.link LIKE ?
                ORDER BY img_timestamp;
            `,
            [`%${link}%`],
        );
        return response[0];
    }

    public static async getCurrentPhonePin(
        player: IValidatedPlayer,
    ): Promise<string | null | Error> {
        const [phones] = await GameDB.query<IPhone[]>('SELECT * FROM phone_phones WHERE id = ?', [
            player.identifiers.steam,
        ]);
        if (!phones || phones.length === 0) {
            return new Error(
                `Es konnte kein Handy für den Spieler ${player.playerdata.fullname} gefunden werden.`,
            );
        }
        return phones[0].pin;
    }

    public static async deletePhoneByIdentifier(identifier: string): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            'DELETE FROM phone_phones WHERE id = ?',
            [identifier],
        );
        return result.affectedRows > 0;
    }

    public static async getPhoneByNumber(phoneNumber: string): Promise<IPhone | null> {
        const [phones] = await GameDB.query<IPhone[]>(
            'SELECT * FROM phone_phones WHERE phone_number = ?',
            [phoneNumber],
        );
        return phones[0] || null;
    }

    public static async getPhoneBySteamID(steamID: string): Promise<IPhone | null> {
        const [phones] = await GameDB.query<IPhone[]>('SELECT * FROM phone_phones WHERE id = ?', [
            steamID,
        ]);
        return phones[0] || null;
    }

    public static async getPhoneDataByPhone(phone: IPhone): Promise<IPhoneFullData>;
    public static async getPhoneDataByPhone<T extends SelectorKeyObject<IPhoneFullData>>(
        phone: IPhone,
        selectors: T,
    ): Promise<FilteredSelectorData<IPhoneFullData, T>>;
    public static async getPhoneDataByPhone<T extends SelectorKeyObject<IPhoneFullData>>(
        phone: IPhone,
        selectors?: T,
    ) {
        const response: Partial<IPhoneFullData> = {};

        if (!selectors || selectors.phone) {
            response.phone = phone;
        }
        if (!selectors || selectors.backups) {
            response.backups = await this.getBackupDataByPhone(phone);
        }
        if (!selectors || selectors.apps) {
            response.apps = {
                clockAlarms: await this.getClockAlarmsByPhone(phone),
                darkchat: await this.getDarkchatAppDataByPhone(phone),
                instagram: await this.getInstagramAppDataByPhone(phone),
                mail: await this.getMailAppDataByPhone(phone),
                tiktok: await this.getTiktokAppData(phone),
                twitter: await this.getTwitterAppDataByPhone(phone),
                yellowPages: await this.getYellowPagesAppDataByPhone(phone),
            };
        }
        if (!selectors || selectors.currentSessions) {
            response.currentSessions = await this.getCurrentSessionsByPhone(phone);
        }
        if (!selectors || selectors.savedLocations) {
            response.savedLocations = await this.getSavedLocationsByPhone(phone);
        }
        if (!selectors || selectors.notes) {
            response.notes = await this.getNotesByPhone(phone);
        }
        if (!selectors || selectors.blocked) {
            response.blocked = await this.getBlockedNumbersByPhone(phone);
        }
        if (!selectors || selectors.callHistory) {
            response.callHistory = await this.getCallHistoryByPhone(phone);
        }
        if (!selectors || selectors.voiceMailHistory) {
            response.voiceMailHistory = await this.getVoiceMailHistoryByPhone(phone);
        }
        if (!selectors || selectors.savedContacts) {
            response.savedContacts = await this.getSavedContactsByPhone(phone);
        }
        if (!selectors || selectors.savedPhotos) {
            response.savedPhotos = await this.getSavedPhotosByPhone(phone);
        }
        if (!selectors || selectors.voiceMemoRecordings) {
            response.voiceMemoRecordings = await this.getVoiceMemoRecordingsByPhone(phone);
        }
        if (!selectors || selectors.walletTransactions) {
            response.walletTransactions = await this.getWalletTransactionsByPhone(phone);
        }

        return response as FilteredSelectorData<IPhoneFullData, T>;
    }

    private static async getClockAlarmsByPhone(phone: IPhone): Promise<IPhoneClockAlarms[]> {
        const [clockAlarms] = await GameDB.query<IPhoneClockAlarms[]>(
            `SELECT * FROM phone_clock_alarms WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return clockAlarms;
    }

    private static async getYellowPagesAppDataByPhone(phone: IPhone): Promise<IAppDataYellowPages> {
        const [yellowPagesPosts] = await GameDB.query<IPhoneYellowPagesPosts[]>(
            `SELECT * FROM phone_yellow_pages_posts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return {
            posts: yellowPagesPosts,
        };
    }

    private static async getTwitterAppDataByPhone(phone: IPhone): Promise<IAppDataTwitter> {
        const twitterAppData: IAppDataTwitter = {
            accounts: [],
        };

        const [twitterAccounts] = await GameDB.query<IPhoneTwitterAccounts[]>(
            `SELECT * FROM phone_twitter_accounts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        if (twitterAccounts.length === 0) return twitterAppData;

        const usernames = twitterAccounts.map((account) => account.username);

        const [twitterMessages] = await GameDB.query<IPhoneTwitterMessages[]>(
            `SELECT * FROM phone_twitter_messages WHERE sender IN (?) OR recipient IN (?)`,
            [usernames, usernames],
        );
        const [twitterTweets] = await GameDB.query<IPhoneTwitterTweets[]>(
            `SELECT * FROM phone_twitter_tweets WHERE username IN (?)`,
            [usernames],
        );

        twitterAccounts.forEach((account) => {
            twitterAppData.accounts.push({
                accountData: account,
                messagesSend: twitterMessages.filter(
                    (message) => message.sender === account.username,
                ),
                messagesReceived: twitterMessages.filter(
                    (message) => message.recipient === account.username,
                ),
                tweets: twitterTweets.filter((tweet) => tweet.username === account.username),
            });
        });

        return twitterAppData;
    }

    private static async getTiktokAppData(phone: IPhone): Promise<IAppDataTiktok> {
        const tiktokAppData: IAppDataTiktok = {
            accounts: [],
        };
        const [tiktokAccounts] = await GameDB.query<IPhoneTiktokAccounts[]>(
            `SELECT * FROM phone_tiktok_accounts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        if (tiktokAccounts.length === 0) return tiktokAppData;

        const usernames = tiktokAccounts.map((account) => account.username);

        const [tiktokComments] = await GameDB.query<IPhoneTiktokComments[]>(
            `SELECT * FROM phone_tiktok_comments WHERE username IN (?)`,
            [usernames],
        );
        const [tiktokVideos] = await GameDB.query<IPhoneTiktokVideos[]>(
            `SELECT * FROM phone_tiktok_videos WHERE username IN (?)`,
            [usernames],
        );
        const [tiktokChannels] = await GameDB.query<IPhoneTiktokChannels[]>(
            `SELECT * FROM phone_tiktok_channels`,
        );
        const [tiktokMessages] = await GameDB.query<IPhoneTiktokMessages[]>(
            `SELECT * FROM phone_tiktok_messages WHERE sender IN (?)`,
            [usernames],
        );

        tiktokAccounts.forEach((account) => {
            const messagesSend: {
                channel: IPhoneTiktokChannels;
                message: IPhoneTiktokMessages;
            }[] = [];
            tiktokMessages.forEach((message) => {
                const channel = tiktokChannels.find((chan) => chan.id === message.channel_id);
                if (channel) {
                    messagesSend.push({ channel, message });
                }
            });
            tiktokAppData.accounts.push({
                accountData: account,
                comments: tiktokComments.filter((comment) => comment.username === account.username),
                messagesSend,
                video: tiktokVideos.filter((video) => video.username === account.username),
            });
        });

        return tiktokAppData;
    }

    private static async getMailAppDataByPhone(phone: IPhone): Promise<IAppDataMail> {
        const mailAppData: IAppDataMail = {
            accounts: [],
        };

        const [mailLoggedIn] = await GameDB.query<IPhoneMailLoggedIn[]>(
            `SELECT * FROM phone_mail_loggedin WHERE phone_number = ?`,
            [phone.phone_number],
        );
        if (mailLoggedIn.length === 0) return mailAppData;

        const addresses = mailLoggedIn.map((account) => account.address);

        const [mailMessages] = await GameDB.query<IPhoneMailMessages[]>(
            `SELECT * FROM phone_mail_messages WHERE sender IN (?) OR recipient IN (?)`,
            [addresses, addresses],
        );
        const [mailAccounts] = await GameDB.query<IPhoneMailAccounts[]>(
            `SELECT * FROM phone_mail_accounts WHERE address IN (?)`,
            [addresses],
        );

        mailLoggedIn.forEach((address) => {
            mailAppData.accounts.push({
                accountData: mailAccounts.filter(
                    (account) => account.address === address.address,
                )[0],
                messagesSend: mailMessages.filter((message) => message.sender === address.address),
                messagesReceived: mailMessages.filter(
                    (message) => message.recipient === address.address,
                ),
            });
        });

        return mailAppData;
    }

    private static async getInstagramAppDataByPhone(phone: IPhone): Promise<IAppDataInstagram> {
        const instagramAppData: IAppDataInstagram = {
            accounts: [],
        };
        const [instagramAccounts] = await GameDB.query<IPhoneInstagramAccounts[]>(
            `SELECT * FROM phone_instagram_accounts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        if (instagramAccounts.length === 0) return instagramAppData;
        const usernames = instagramAccounts.map((account) => account.username);

        const [instagramComments] = await GameDB.query<IPhoneInstagramComments[]>(
            `SELECT * FROM phone_instagram_comments WHERE username IN (?)`,
            [usernames],
        );
        const [instagramMessages] = await GameDB.query<IPhoneInstagramMessages[]>(
            `SELECT * FROM phone_instagram_messages WHERE sender IN (?) OR recipient IN (?)`,
            [usernames, usernames],
        );
        const [instagramPosts] = await GameDB.query<IPhoneInstagramPosts[]>(
            `SELECT * FROM phone_instagram_posts WHERE username IN (?)`,
            [usernames],
        );

        instagramAccounts.forEach((account) => {
            instagramAppData.accounts.push({
                accountData: account,
                comments: instagramComments.filter(
                    (comment) => comment.username === account.username,
                ),
                messagesSend: instagramMessages.filter(
                    (message) => message.sender === account.username,
                ),
                messagesReceived: instagramMessages.filter(
                    (message) => message.recipient === account.username,
                ),
                posts: instagramPosts.filter((post) => post.username === account.username),
            });
        });

        return instagramAppData;
    }

    private static async getDarkchatAppDataByPhone(phone: IPhone): Promise<IAppDataDarkchat> {
        const darkchatAppData: IAppDataDarkchat = {
            username: null,
            memberOfChannels: [],
            messagesSend: [],
        };

        const [darkchatAccounts] = await GameDB.query<IPhoneDarkchatAccounts[]>(
            `SELECT * FROM phone_darkchat_accounts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        if (darkchatAccounts.length === 0) return darkchatAppData;
        darkchatAppData.username = darkchatAccounts[0].username;

        const [darkchatChannels] = await GameDB.query<IPhoneDarkchatChannels[]>(
            `SELECT * FROM phone_darkchat_channels WHERE name IN (SELECT channel_name FROM phone_darkchat_members WHERE username = ?)`,
            [darkchatAppData.username],
        );
        darkchatAppData.memberOfChannels = darkchatChannels;

        const [darkchatMessages] = await GameDB.query<IPhoneDarkchatMessages[]>(
            `SELECT * FROM phone_darkchat_messages WHERE sender = ?`,
            [darkchatAppData.username],
        );
        darkchatAppData.messagesSend = darkchatMessages;

        return darkchatAppData;
    }

    private static async getBackupDataByPhone(phone: IPhone): Promise<IPhoneBackups[]> {
        const [backups] = await GameDB.query<IPhoneBackups[]>(
            `SELECT * FROM phone_backups WHERE id = ?`,
            [phone.id],
        );
        return backups;
    }

    private static async getCurrentSessionsByPhone(
        phone: IPhone,
    ): Promise<IPhoneLoggedInAccounts[]> {
        const [currentSessions] = await GameDB.query<IPhoneLoggedInAccounts[]>(
            `SELECT * FROM phone_logged_in_accounts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return currentSessions;
    }

    private static async getSavedLocationsByPhone(phone: IPhone): Promise<IPhoneMapLocations[]> {
        const [savedLocations] = await GameDB.query<IPhoneMapLocations[]>(
            `SELECT * FROM phone_maps_locations WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return savedLocations;
    }

    private static async getNotesByPhone(phone: IPhone): Promise<IPhoneNotes[]> {
        const [notes] = await GameDB.query<IPhoneNotes[]>(
            `SELECT * FROM phone_notes WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return notes;
    }

    private static async getBlockedNumbersByPhone(phone: IPhone): Promise<IPhoneBlocked> {
        const [blockedNumbers] = await GameDB.query<IPhonePhoneBlockedNumbers[]>(
            `SELECT * FROM phone_phone_blocked_numbers WHERE phone_number = ? OR blocked_number = ?`,
            [phone.phone_number, phone.phone_number],
        );
        return {
            numbers: blockedNumbers
                .filter((blocked) => blocked.phone_number === phone.phone_number)
                .map((blocked) => blocked.blocked_number),
            byNumbers: blockedNumbers
                .filter((blocked) => blocked.blocked_number === phone.phone_number)
                .map((blocked) => blocked.phone_number),
        };
    }

    private static async getCallHistoryByPhone(phone: IPhone): Promise<IPhonePhoneCalls[]> {
        const [callHistory] = await GameDB.query<IPhonePhoneCalls[]>(
            `SELECT * FROM phone_phone_calls WHERE caller = ? OR callee = ?`,
            [phone.phone_number, phone.phone_number],
        );
        return callHistory;
    }

    private static async getVoiceMailHistoryByPhone(
        phone: IPhone,
    ): Promise<IPhonePhoneVoiceMails[]> {
        const [voiceMailHistory] = await GameDB.query<IPhonePhoneVoiceMails[]>(
            `SELECT * FROM phone_phone_voicemail WHERE caller = ? OR callee = ?`,
            [phone.phone_number, phone.phone_number],
        );
        return voiceMailHistory;
    }

    private static async getSavedContactsByPhone(phone: IPhone): Promise<IPhonePhoneContacts[]> {
        const [savedContacts] = await GameDB.query<IPhonePhoneContacts[]>(
            `SELECT * FROM phone_phone_contacts WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return savedContacts;
    }

    private static async getSavedPhotosByPhone(phone: IPhone): Promise<IPhonePhotos[]> {
        const [savedPhotos] = await GameDB.query<IPhonePhotos[]>(
            `SELECT * FROM phone_photos WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return savedPhotos;
    }

    private static async getVoiceMemoRecordingsByPhone(
        phone: IPhone,
    ): Promise<IPhoneVoiceMemoRecordings[]> {
        const [voiceMemoRecordings] = await GameDB.query<IPhoneVoiceMemoRecordings[]>(
            `SELECT * FROM phone_voice_memos_recordings WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return voiceMemoRecordings;
    }

    private static async getWalletTransactionsByPhone(
        phone: IPhone,
    ): Promise<IPhoneWalletTransactions[]> {
        const [walletTransactions] = await GameDB.query<IPhoneWalletTransactions[]>(
            `SELECT * FROM phone_wallet_transactions WHERE phone_number = ?`,
            [phone.phone_number],
        );
        return walletTransactions;
    }
}
