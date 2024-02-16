import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import {
    IPhone,
    IPhoneDarkchatAccounts,
    IPhoneDarkchatMembers,
    IPhoneInstagramAccounts,
    IPhoneInstagramPosts,
    IPhoneNotes,
    IPhonePhotos,
    IPhoneTiktokAccounts,
    IPhoneTiktokVideos,
    IPhoneTinderAccounts,
    IPhoneTwitterAccounts,
    IPhoneTwitterTweets,
} from '@sql/schema/Phone.schema';
import LogManager from '@utils/Logger';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';

// TODO refactor
export class DeletePhone extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('deletephone')
                .setDescription('Löscht ein Handy')
                .addStringOption((option) =>
                    option.setName('steamid').setDescription('SteamID').setRequired(true),
                )
                .addBooleanOption((option) =>
                    option
                        .setName('reset')
                        .setDescription('Nummer bleibt, Accounts werden gelöscht'),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const reset = interaction.options.getBoolean('reset') ?? false;
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        let phone;
        if (reset) {
            phone = await this.resetPhone(vPlayer.identifiers.steam);
        } else {
            phone = await this.deletePhone(vPlayer.identifiers.steam);
        }
        // write phone into file
        if (typeof phone === 'string') {
            writeFileSync(`${vPlayer.identifiers.steam}.sql`, phone);
            const attachment = new AttachmentBuilder(
                readFileSync(`${vPlayer.identifiers.steam}.sql`),
                {
                    name: `${vPlayer.identifiers.steam}.sql`,
                },
            );
            await this.replyWithEmbed({
                title: reset ? 'Handy zurückgesetzt' : 'Handy gelöscht',
                description: `Owner: ${vPlayer.steamnames.current}\nIdentifier: ${vPlayer.identifiers.steam}`,
                files: [attachment],
            });
        }
    }

    async deletePhone(steamid: string): Promise<string | Error> {
        const insertCollection: string[] = [];
        const [phonequery] = await GameDB.query<IPhone[]>(
            'SELECT * FROM phone_phones WHERE id = ? LIMIT 1',
            [steamid],
        );
        if (phonequery.length === 0) {
            return Error('No Phone found');
        }
        const phone = phonequery[0];
        const darkchatAnswer = await this.deleteDarkchat(phone.phone_number);
        const instagramAnswer = await this.deleteInstagram(phone.phone_number);
        const tiktokAnswer = await this.deleteTiktok(phone.phone_number);
        const tinderAnswer = await this.deleteTinder(phone.phone_number);
        const twitterAnswer = await this.deleteTwitter(phone.phone_number);
        const photosAnswer = await this.deletePhotos(phone.phone_number);
        const notesAnswer = await this.deleteNotes(phone.phone_number);
        if (phone.assinged === undefined) {
            phone.assinged = false;
        }

        insertCollection.push(
            `INSERT INTO phone_phones (id, phone_number, name, pin, face_id, settings, is_setup, assigned, battery) VALUES (
                '${phone.id}',
                '${phone.phone_number}',
                ${phone.name !== null ? `"${phone.name}"` : 'null'},
                ${phone.pin !== null ? `'${phone.pin}'` : 'null'},
                ${phone.face_id !== null ? `'${phone.face_id}'` : 'null'},
                ${phone.settings !== null ? `'${phone.settings}'` : 'null'},
                ${phone.is_setup !== null ? phone.is_setup : 'null'},
                ${phone.assinged !== null ? phone.assinged : 'null'},
                ${phone.battery}
            );`,
        );

        if (typeof darkchatAnswer === 'string') {
            insertCollection.push(darkchatAnswer);
        }
        if (typeof instagramAnswer === 'string') {
            insertCollection.push(instagramAnswer);
        }
        if (typeof tiktokAnswer === 'string') {
            insertCollection.push(tiktokAnswer);
        }
        if (typeof tinderAnswer === 'string') {
            insertCollection.push(tinderAnswer);
        }
        if (typeof twitterAnswer === 'string') {
            insertCollection.push(twitterAnswer);
        }
        if (typeof photosAnswer === 'string') {
            insertCollection.push(photosAnswer);
        }
        if (typeof notesAnswer === 'string') {
            insertCollection.push(notesAnswer);
        }

        try {
            await GameDB.execute('DELETE FROM phone_phones WHERE id = ?', [steamid]);
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Phone');
        }
        return insertCollection.join('\n');
    }

    async resetPhone(steamid: string): Promise<string | Error> {
        const insertCollection: string[] = [];
        const [phonequery] = await GameDB.query<IPhone[]>(
            'SELECT * FROM phone_phones WHERE id = ? LIMIT 1',
            [steamid],
        );
        if (phonequery.length === 0) {
            return Error('No Phone found');
        }
        const phone = phonequery[0];
        const darkchatAnswer = await this.deleteDarkchat(phone.phone_number);
        const instagramAnswer = await this.deleteInstagram(phone.phone_number);
        const tiktokAnswer = await this.deleteTiktok(phone.phone_number);
        const tinderAnswer = await this.deleteTinder(phone.phone_number);
        const twitterAnswer = await this.deleteTwitter(phone.phone_number);
        const photosAnswer = await this.deletePhotos(phone.phone_number);
        const notesAnswer = await this.deleteNotes(phone.phone_number);

        if (typeof darkchatAnswer === 'string') {
            insertCollection.push(darkchatAnswer);
        }
        if (typeof instagramAnswer === 'string') {
            insertCollection.push(instagramAnswer);
        }
        if (typeof tiktokAnswer === 'string') {
            insertCollection.push(tiktokAnswer);
        }
        if (typeof tinderAnswer === 'string') {
            insertCollection.push(tinderAnswer);
        }
        if (typeof twitterAnswer === 'string') {
            insertCollection.push(twitterAnswer);
        }
        if (typeof photosAnswer === 'string') {
            insertCollection.push(photosAnswer);
        }
        if (typeof notesAnswer === 'string') {
            insertCollection.push(notesAnswer);
        }
        await GameDB.execute(
            `UPDATE phone_phones SET pin = null, face_id = null, settings = '{"apps": [["Phone", "Messages", "Camera", "Photos"], ["Settings", "AppStore", "Notes", "LB_APP_IMMO_WARNING", "LB_APP_IMMO_DISPATCH", "LB_APP_IMMO_GARAGE", "LB_APP_IMMO_BANK"]], "display": {"automatic": false, "theme": "dark", "brightness": 1, "size": 0.8}, "streamerMode": false, "locale": "de", "name": "Harry Hirsch", "doNotDisturb": false, "sound": {"volume": 0.5, "ringtone": "default", "silent": false}, "weather": {"celcius": true}, "time": {"twelveHourClock": false}, "security": {"pinCode": false, "faceId": false}, "airplaneMode": false, "storage": {"total": 128000000, "used": 8576331}, "wallpaper": {"background": "immo_0"}, "notifications": [], "phone": {"showCallerId": true}}', is_setup = 0, assigned = 0, battery = 100 WHERE id = ?`,
            [steamid],
        );
        return insertCollection.join('\n');
    }

    async deleteDarkchat(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            const [query] = await GameDB.query<IPhoneDarkchatAccounts[]>(
                'SELECT * FROM phone_darkchat_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (query.length === 0) {
                return '#No Darkchat Account found';
            }
            const account = query[0];
            returnstring.push(
                `INSERT INTO phone_darkchat_accounts (phone_number, username) VALUES (${account.phone_number}, ${account.username});`,
            );
            const [channels] = await GameDB.query<IPhoneDarkchatMembers[]>(
                'SELECT * FROM phone_darkchat_members WHERE sender = ?',
                [account.username],
            );
            if (channels.length === 0) {
                await GameDB.execute('DELETE FROM phone_darkchat_accounts WHERE phone_number = ?', [
                    phonenumber,
                ]);
                return returnstring.join('\n');
            }
            for (const channel of channels) {
                returnstring.push(
                    `INSERT INTO phone_darkchat_members (channel_name, username) VALUES (${channel.channel_name}, ${channel.username});`,
                );
            }
            // Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_darkchat_accounts WHERE phone_number = ?', [
                phonenumber,
            ]);
            await GameDB.execute('DELETE FROM phone_darkchat_messages WHERE sender = ?', [
                account.username,
            ]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Darkchat Account');
        }
    }

    async deleteInstagram(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            const [query] = await GameDB.query<IPhoneInstagramAccounts[]>(
                'SELECT * FROM phone_instagram_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (query.length === 0) {
                return '#No Instagram Account found';
            }
            const account = query[0];
            returnstring.push(
                `INSERT INTO phone_instagram_accounts (displayname, username, password, profile_image, bio, phone_number, verified, date_joined) VALUES (
                '${account.displayname}',
                '${account.username}',
                ${account.password},
                ${account.profile_image !== null ? `'${account.profile_image}'` : 'null'},
                ${account.bio !== null ? `'${account.bio}'` : 'null'},
                ${account.phone_number},
                ${account.verified !== null ? account.verified : 'null'},
                '${this.formatTimestamp(account.date_joined)}'
                );`,
            );

            const [posts] = await GameDB.query<IPhoneInstagramPosts[]>(
                'SELECT * FROM phone_instagram_posts WHERE username = ?',
                [account.username],
            );
            if (posts.length === 0) {
                await GameDB.execute(
                    'DELETE FROM phone_instagram_accounts WHERE phone_number = ?',
                    [phonenumber],
                );
                return returnstring.join('\n');
            }
            for (const post of posts) {
                returnstring.push(
                    `INSERT INTO phone_instagram_posts (id, media, caption, like_count, comment_count, username, timestamp) VALUES (
                        '${post.id}',
                        ${post.media !== null ? `'${post.media}'` : 'null'},
                        '${post.caption}',
                        ${post.like_count},
                        ${post.comment_count},
                        '${post.username}',
                        '${this.formatTimestamp(post.timestamp)}'
                    );`,
                );
            }
            // Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_instagram_accounts WHERE phone_number = ?', [
                phonenumber,
            ]);
            await GameDB.execute('DELETE FROM phone_instagram_posts WHERE username = ?', [
                account.username,
            ]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Instagram Account');
        }
    }

    async deleteTiktok(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            const [query] = await GameDB.query<IPhoneTiktokAccounts[]>(
                'SELECT * FROM phone_tiktok_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (query.length === 0) {
                return '#No Tiktok Account found';
            }
            const account = query[0];
            returnstring.push(
                `INSERT INTO phone_tiktok_accounts (name, bio, avatar, username, password, verified, follower_count, following_count, like_count, video_count, twitter, instagram, show_likes, phone_number, date_joined) VALUES (
                '${account.name}',
                ${account.bio !== null ? `'${account.bio}'` : 'null'},
                ${account.avatar !== null ? `'${account.avatar}'` : 'null'},
                '${account.username}',
                '${account.password}',
                ${account.verified !== null ? account.verified : 'null'},
                ${account.follower_count},
                ${account.following_count},
                ${account.like_count},
                ${account.video_count},
                ${account.twitter !== null ? `'${account.twitter}'` : 'null'},
                ${account.instagram !== null ? `'${account.instagram}'` : 'null'},
                ${account.show_likes !== null ? account.show_likes : 'null'},
                '${account.phone_number}',
                '${this.formatTimestamp(account.date_joined)}'
                );`,
            );

            const [videos] = await GameDB.query<IPhoneTiktokVideos[]>(
                'SELECT * FROM phone_tiktok_videos WHERE username = ?',
                [account.username],
            );
            if (videos.length === 0) {
                await GameDB.execute('DELETE FROM phone_tiktok_accounts WHERE phone_number = ?', [
                    phonenumber,
                ]);
                return returnstring.join('\n');
            }
            for (const video of videos) {
                returnstring.push(
                    `INSERT INTO phone_tiktok_videos (id, username, src, caption, metadata, music, likes, comments, views, saves, pinned_comments, timestamp) VALUES (
                    '${video.id}',
                    '${video.username}',
                    '${video.src}',
                    ${video.caption !== null ? `'${video.caption}'` : 'null'},
                    ${video.metadata !== null ? `'${video.metadata}'` : 'null'},
                    ${video.music !== null ? `'${video.music}'` : 'null'},
                    ${video.likes},
                    ${video.comments},
                    ${video.views},
                    ${video.saves},
                    ${video.pinned_comment !== null ? `'${video.pinned_comment}'` : 'null'},
                    '${this.formatTimestamp(video.timestamp)}'
                    );`,
                );
            }
            // Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_tiktok_accounts WHERE phone_number = ?', [
                phonenumber,
            ]);
            await GameDB.execute('DELETE FROM phone_tiktok_videos WHERE username = ?', [
                account.username,
            ]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Tiktok Account');
        }
    }

    async deleteTinder(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            const [query] = await GameDB.query<IPhoneTinderAccounts[]>(
                'SELECT * FROM phone_tinder_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            );
            if (query.length === 0) {
                return '#No Tinder Account found';
            }
            const account = query[0];
            // Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_tinder_accounts WHERE phone_number = ?', [
                phonenumber,
            ]);
            return `INSERT INTO phone_tinder_accounts (name, phone_number, photos, bio, dob, is_male, interested_men, interested_women) VALUES (
            '${account.name}',
            '${account.phone_number}',
            ${account.photos !== null ? `'${account.photos}'` : 'null'},
            ${account.bio !== null ? `'${account.bio}'` : 'null'},
            '${account.dob}',
            ${account.is_male},
            ${account.interested_men},
            ${account.interested_women}
            );`;
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Tinder Account');
        }
    }

    async deleteTwitter(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            const [query] = await GameDB.query<IPhoneTwitterAccounts[]>(
                'SELECT * FROM phone_twitter_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (query.length === 0) {
                return '#No Twitter Account found';
            }
            const account = query[0];
            returnstring.push(
                `INSERT INTO phone_twitter_accounts (display_name, username, password, phone_number, bio, profile_image, profile_header, pinned_tweet, verified, follower_count, following_count, date_joined) VALUES (
                '${account.display_name}',
                '${account.username}',
                '${account.password}',
                '${account.phone_number}',
                ${account.bio !== null ? `'${account.bio}'` : 'null'},
                ${account.profile_image !== null ? `'${account.profile_image}'` : 'null'},
                ${account.profile_header !== null ? `'${account.profile_header}'` : 'null'},
                ${account.pinned_tweet !== null ? `'${account.pinned_tweet}'` : 'null'},
                ${account.verified !== null ? account.verified : 'null'},
                ${account.follower_count},
                ${account.following_count},
                '${this.formatTimestamp(account.date_joined)}'
                );`,
            );

            const [tweets] = await GameDB.query<IPhoneTwitterTweets[]>(
                'SELECT * FROM phone_twitter_tweets WHERE username = ?',
                [account.username],
            );
            if (tweets.length === 0) {
                await GameDB.execute('DELETE FROM phone_twitter_tweets WHERE username = ?', [
                    account.username,
                ]);
                return returnstring.join('\n');
            }
            for (const tweet of tweets) {
                returnstring.push(
                    `INSERT INTO phone_twitter_tweets (id, username, content, attachments, reply_to, like_count, reply_count, retweet_count, timestamp) VALUES (
                    '${tweet.id}',
                    '${tweet.username}',
                    ${tweet.content !== null ? `'${tweet.content}'` : 'null'},
                    ${tweet.attachments !== null ? `'${tweet.attachments}'` : 'null'},
                    ${tweet.reply_to !== null ? `'${tweet.reply_to}'` : 'null'},
                    ${tweet.like_count !== null ? tweet.like_count : 'null'},
                    ${tweet.reply_count !== null ? tweet.reply_count : 'null'},
                    ${tweet.retweet_count !== null ? tweet.retweet_count : 'null'},
                    '${this.formatTimestamp(tweet.timestamp)}'
                    );`,
                );
            }
            // Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_twitter_accounts WHERE phone_number = ?', [
                phonenumber,
            ]);
            await GameDB.execute('DELETE FROM phone_twitter_tweets WHERE username = ?', [
                account.username,
            ]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Twitter Account');
        }
    }

    async deletePhotos(phonenumber: string): Promise<string | Error> {
        try {
            const [photos] = await GameDB.query<IPhonePhotos[]>(
                'SELECT * FROM phone_photos WHERE phone_number = ?',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (photos.length === 0) {
                return '#No Photos found';
            }
            for (const photo of photos) {
                returnstring.push(
                    `INSERT INTO phone_photos (phone_number, link, is_video, size, timestamp) VALUES (
                    '${photo.phone_number}',
                    '${photo.link}',
                    ${photo.is_video !== null ? photo.is_video : 'null'},
                    ${photo.size},
                    '${this.formatTimestamp(photo.timestamp)}'
                    );`,
                );
            }
            await GameDB.execute('DELETE FROM phone_photos WHERE phone_number = ?', [phonenumber]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Photos');
        }
    }

    async deleteNotes(phonenumber: string): Promise<string | Error> {
        try {
            const [notes] = await GameDB.query<IPhoneNotes[]>(
                'SELECT * FROM phone_notes WHERE phone_number = ?',
                [phonenumber],
            );
            const returnstring: String[] = [];
            if (notes.length === 0) {
                return '#No Notes found';
            }
            for (const note of notes) {
                returnstring.push(
                    `INSERT INTO phone_notes (id, phone_number, title, content, timestamp) VALUES (
                    '${note.id}',
                    '${note.phone_number}',
                    '${note.title}',
                    '${note.content}',
                    '${this.formatTimestamp(note.timestamp)}'
                    );`,
                );
            }
            await GameDB.execute('DELETE FROM phone_photos WHERE phone_number = ?', [phonenumber]);
            return returnstring.join('\n');
        } catch (error) {
            LogManager.error(error);
            return Error('Error while deleting Notes');
        }
    }

    formatTimestamp(timestamp: Date): string {
        const year = timestamp.getFullYear();
        const month = (timestamp.getMonth() + 1).toString().padStart(2, '0'); // Monate sind nullbasiert
        const day = timestamp.getDate().toString().padStart(2, '0');
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const seconds = timestamp.getSeconds().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
