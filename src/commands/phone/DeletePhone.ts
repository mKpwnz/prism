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
        let phone = phonequery[0]
        let darkchatAnswer = await this.deleteDarkchat(steamid)
        let instagramAnswer = await this.deleteInstagram(steamid)
        
        
        insertCollection.push('INSERT INTO phone_phones (id, phone_number, name, pin, face_id, settings, is_setup, assigned, battery) VALUES (' + phone.id + ', ' + phone.phone_number + ', ' + phone.name + ', ' + phone.pin + ', ' + phone.face_id + ', ' + phone.settings + ', ' + phone.is_setup + ', ' + phone.assinged + ', ' + phone.battery + ');')
        if (typeof darkchatAnswer === 'string') {
            insertCollection.push(darkchatAnswer)
        }
        if (typeof instagramAnswer === 'string') {
            insertCollection.push(instagramAnswer)
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
            return Error('Error while deleting Darkchat Account')
        }
    }

    async deleteTiktok(phonenumber: string): Promise<string | Error> {
        return Error('Not implemented yet')
    }

}
