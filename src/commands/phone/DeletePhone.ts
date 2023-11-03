import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { Player } from '@controller/Player.controller'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { GameDB } from '@sql/Database'
import {
    IPhone,
    IPhoneDarkchatAccounts,
    IPhoneDarkchatMembers,
    IPhoneDarkchatMessages,
    IPhoneInstagramAccounts,
    IPhoneInstagramPosts,
    IPhoneNotes,
    IPhonePhotos,
    IPhoneTiktokAccounts,
    IPhoneTiktokVideos,
    IPhoneTinderAccounts,
    IPhoneTwitterAccounts,
    IPhoneTwitterTweets,
} from '@sql/schema/Phone.schema'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class DeletePhone extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_LIMITED,
        ]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('deletephone')
                .setDescription('Löscht ein Handy')
                .addStringOption((option) => option.setName('steamid').setDescription('SteamID').setRequired(true))
                .addBooleanOption((option) => option.setName('reset').setDescription('Nummer bleibt, Accounts werden gelöscht')),
            this,
        )
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const vPlayer = await Player.validatePlayer(options.getString('steamid') ?? '')
        let embed = this.getEmbedTemplate(interaction)
        if (!vPlayer) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        let phone = await this.deletePhone(vPlayer.identifiers.steam)
    }

    async deletePhone(steamid: string): Promise<string | Error> {
        let insertCollection: string[] = []
        let [phonequery] = await GameDB.query<IPhone[]>(
            'SELECT * FROM phone_phones WHERE id = ? LIMIT 1',
            [steamid],
        )
        if (phonequery.length === 0) {
            return Error('No Phone found')
        }
        let phone = phonequery[0]
        let darkchatAnswer = await this.deleteDarkchat(phone.phone_number)
        let instagramAnswer = await this.deleteInstagram(phone.phone_number)
        let tiktokAnswer = await this.deleteTiktok(phone.phone_number)
        let tinderAnswer = await this.deleteTinder(phone.phone_number)
        let twitterAnswer = await this.deleteTwitter(phone.phone_number)
        let photosAnswer = await this.deletePhotos(phone.phone_number)
        let notesAnswer = await this.deleteNotes(phone.phone_number)
        
        
        insertCollection.push('INSERT INTO phone_phones (id, phone_number, name, pin, face_id, settings, is_setup, assigned, battery) VALUES (' + phone.id + ', ' + phone.phone_number + ', ' + phone.name + ', ' + phone.pin + ', ' + phone.face_id + ', ' + phone.settings + ', ' + phone.is_setup + ', ' + phone.assinged + ', ' + phone.battery + ');')
        if (typeof darkchatAnswer === 'string') {
            insertCollection.push(darkchatAnswer)
        }
        if (typeof instagramAnswer === 'string') {
            insertCollection.push(instagramAnswer)
        }
        if (typeof tiktokAnswer === 'string') {
            insertCollection.push(tiktokAnswer)
        }
        if (typeof tinderAnswer === 'string') {
            insertCollection.push(tinderAnswer)
        }
        if (typeof twitterAnswer === 'string') {
            insertCollection.push(twitterAnswer)
        }
        if (typeof photosAnswer === 'string') {
            insertCollection.push(photosAnswer)
        }
        if (typeof notesAnswer === 'string') {
            insertCollection.push(notesAnswer)
        }
        return insertCollection.join('\n')
    }

    async resetPhone(steamid: string): Promise<string | Error> {
        return Error('Not implemented yet')
    }

    async deleteDarkchat(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneDarkchatAccounts[]>(
                'SELECT * FROM phone_darkchat_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(query.length === 0) {
                return '#No Darkchat Account found'
            }
            let account = query[0]
            returnstring.push(
                'INSERT INTO phone_darkchat_accounts (phone_number, username) VALUES (' +
                    account.phone_number +
                    ', ' +
                    account.username +
                    ');',
            )
            let [channels] = await GameDB.query<IPhoneDarkchatMembers[]>(
                'SELECT * FROM phone_darkchat_members WHERE sender = ?',
                [account.username],
            )
            if (channels.length === 0) {
                await GameDB.execute('DELETE FROM phone_darkchat_accounts WHERE phone_number = ?', [
                    phonenumber,
                ])
                return returnstring.join('\n')
            }
            for (let channel of channels) {
                returnstring.push(
                    'INSERT INTO phone_darkchat_members (channel_name, username) VALUES (' +
                        channel.channel_name +
                        ', ' +
                        channel.username +
                        ');',
                )
            }
            //Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_darkchat_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            await GameDB.execute('DELETE FROM phone_darkchat_messages WHERE sender = ?', [account.username])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Darkchat Account')
        }
    }

    async deleteInstagram(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneInstagramAccounts[]>(
                'SELECT * FROM phone_instagram_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(query.length === 0) {
                return '#No Instagram Account found'
            }
            let account = query[0]
            returnstring.push(
                'INSERT INTO phone_instagram_accounts (displayname, username, password, profile_image, bio, phone_number, verified, date_joined) VALUES (' +
                    account.displayname +
                    ', ' +
                    account.username +
                    ', ' +
                    account.password + ', ' + account.profile_image + ', ' + account.bio + ', ' + account.phone_number + ', ' + account.verified + ', ' + account.date_joined +
                    ');',
            )
            let [posts] = await GameDB.query<IPhoneInstagramPosts[]>(
                'SELECT * FROM phone_instagram_posts WHERE username = ?',
                [account.username],
            )
            if (posts.length === 0) {
                await GameDB.execute('DELETE FROM phone_instagram_accounts WHERE phone_number = ?', [
                    phonenumber,
                ])
                return returnstring.join('\n')
            }
            for (let post of posts) {
                returnstring.push(
                    'INSERT INTO phone_instagram_posts (id, media, caption, like_count, comment_count, username, timestamp) VALUES (' +
                        post.id +
                        ', ' +
                        post.media + ', ' + post.caption + ', ' + post.like_count + ', ' + post.comment_count + ', ' + post.username + ', ' + post.timestamp +
                        ');',
                )
            }
            //Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_instagram_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            await GameDB.execute('DELETE FROM phone_instagram_posts WHERE username = ?', [account.username])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Instagram Account')
        }
    }

    async deleteTiktok(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneTiktokAccounts[]>(
                'SELECT * FROM phone_tiktok_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(query.length === 0) {
                return '#No Tiktok Account found'
            }
            let account = query[0]
            returnstring.push(
                'INSERT INTO phone_tiktok_accounts (name, bio, avatar, username, password, verified, follower_count, following_count, like_count, video_count, twitter, instagram, show_likes, phone_number, date_joined) VALUES (' +
                    account.name +
                    ', ' +
                    account.bio +
                    ', ' +
                    account.avatar + ', ' + account.username + ', ' + account.password + ', ' + account.verified + ', ' + account.follower_count + ', ' + account.following_count + ', ' + account.like_count + ', ' + account.video_count + ', ' + account.twitter + ', ' + account.instagram + ', ' + account.show_likes + ', ' + account.phone_number + ', ' + account.date_joined +
                    ');',
            )
            let [videos] = await GameDB.query<IPhoneTiktokVideos[]>(
                'SELECT * FROM phone_tiktok_videos WHERE username = ?',
                [account.username],
            )
            if (videos.length === 0) {
                await GameDB.execute('DELETE FROM phone_tiktok_accounts WHERE phone_number = ?', [
                    phonenumber,
                ])
                return returnstring.join('\n')
            }
            for (let video of videos) {
                returnstring.push(
                    'INSERT INTO phone_tiktok_videos (id, username, src, caption, metadata, music, likes, comments, views, saves, pinned_comments, timestamp) VALUES (' +
                    video.id +
                        ', ' +
                        video.username + ', ' + video.src + ', ' + video.caption + ', ' + video.metadata + ', ' + video.music + ', ' + video.likes + ', ' + video.comments + ', ' + video.views + ', ' + video.saves + ', ' + video.pinned_comment + ', ' + video.timestamp +
                        ');',
                )
            }
            //Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_tiktok_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            await GameDB.execute('DELETE FROM phone_tiktok_videos WHERE username = ?', [account.username])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Tiktok Account')
        }
    }

    async deleteTinder(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneTinderAccounts[]>(
                'SELECT * FROM phone_tinder_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(query.length === 0) {
                return '#No Tinder Account found'
            }
            let account = query[0]
            //Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_tinder_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            return 'INSERT INTO phone_tinder_accounts (name, phone_number, photos, bio, dob, is_male, interested_men, interested_women) VALUES (' +
            account.name +
            ', ' +
            account.phone_number +
            ', ' +
            account.photos + ', ' + account.bio + ', ' + account.dob + ', ' + account.is_male + ', ' + account.interested_men + ', ' + account.interested_women + 
            ');'
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Tinder Account')
        }
    }

    async deleteTwitter(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneTwitterAccounts[]>(
                'SELECT * FROM phone_twitter_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(query.length === 0) {
                return '#No Twitter Account found'
            }
            let account = query[0]
            returnstring.push(
                'INSERT INTO phone_twitter_accounts (display_name, username, password, phone_number, bio, profile_image, profile_header, pinned_tweet, verified, follower_count, following_count, date_joined) VALUES (' +
                    account.displayname +
                    ', ' +
                    account.username +
                    ', ' +
                    account.password + ', ' + account.phone_number + ', ' + account.bio + ', ' + account.profile_image + ', ' + account.profile_header + ', ' + account.pinned_tweet + ', ' + account.verified + ', ' + account.follower_count + ', ' + account.following_count + ', ' + account.date_joined +
                    ');',
            )
            let [tweets] = await GameDB.query<IPhoneTwitterTweets[]>(
                'SELECT * FROM phone_twitter_tweets WHERE username = ?',
                [account.username],
            )
            if (tweets.length === 0) {
                await GameDB.execute('DELETE FROM phone_twitter_tweets WHERE phone_number = ?', [
                    phonenumber,
                ])
                return returnstring.join('\n')
            }
            for (let tweet of tweets) {
                returnstring.push(
                    'INSERT INTO phone_twitter_tweets (id, username, content, attachments, reply_to, like_count, reply_count, retweet_count, timestamp) VALUES (' +
                    tweet.id +
                        ', ' +
                        tweet.username + ', ' + tweet.content + ', ' + tweet.attachments + ', ' + tweet.reply_to + ', ' + tweet.like_count + ', ' + tweet.reply_count + ', ' + tweet.retweet_count + ', ' + tweet.timestamp +
                        ');',
                )
            }
            //Delete Account and Messages
            await GameDB.execute('DELETE FROM phone_twitter_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            await GameDB.execute('DELETE FROM phone_twitter_tweets WHERE username = ?', [account.username])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Twitter Account')
        }
    }

    async deletePhotos(phonenumber: string): Promise<string | Error> {
        try {
            let [photos] = await GameDB.query<IPhonePhotos[]>(
                'SELECT * FROM phone_photos WHERE phone_number = ?',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(photos.length === 0) {
                return '#No Photos found'
            }
            for (let photo of photos) {
                returnstring.push(
                    'INSERT INTO phone_photos (phone_number, link, is_video, size, time_stamp) VALUES (' +
                    photo.phone_number +
                        ', ' +
                        photo.link + ', ' + photo.is_video + ', ' + photo.size + ', ' + photo.timestamp + 
                        ');',
                )
            }
            await GameDB.execute('DELETE FROM phone_photos WHERE phone_number = ?', [
                phonenumber,
            ])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Photos')
        }
    }

    async deleteNotes(phonenumber: string): Promise<string | Error> {
        try {
            let [notes] = await GameDB.query<IPhoneNotes[]>(
                'SELECT * FROM phone_notes WHERE phone_number = ?',
                [phonenumber],
            )
            let returnstring: String[] = []
            if(notes.length === 0) {
                return '#No Notes found'
            }
            for (let note of notes) {
                returnstring.push(
                    'INSERT INTO phone_notes (id, phone_number, title, content, timestamp) VALUES (' +
                    note.id +
                        ', ' +
                        note.phone_number + ', ' + note.title + ', ' + note.content + ', ' + note.timestamp + 
                        ');',
                )
            }
            await GameDB.execute('DELETE FROM phone_photos WHERE phone_number = ?', [
                phonenumber,
            ])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Notes')
        }
    }

}
