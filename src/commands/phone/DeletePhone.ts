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
} from '@sql/schema/Phone.schema'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class DeletePhone extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('deletephone')
                .setDescription('Löscht ein Handy')
                .addStringOption((option) => option.setName('steamid').setDescription('SteamID')),
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
        let [phonequery] = await GameDB.query<IPhone[]>(
            'SELECT * FROM phone_phones WHERE id = ? LIMIT 1',
            [steamid],
        )
        let phone = phonequery[0]

        return ''
    }

    async deleteDarkchat(phonenumber: string): Promise<string | Error> {
        try {
            // Query Data, save Data as Insert String and Delete
            let [query] = await GameDB.query<IPhoneDarkchatAccounts[]>(
                'SELECT * FROM phone_darkchat_accounts WHERE phone_number = ? LIMIT 1',
                [phonenumber],
            )
            let returnstring: String[] = []
            let account = query[0]
            returnstring.push(
                'INSERT INTO phone_darkchat_accounts (phone_number, username) VALUES ' +
                    account.phone_number +
                    ', ' +
                    account.username +
                    ';',
            )
            let [channels] = await GameDB.query<IPhoneDarkchatMembers[]>(
                'SELECT * FROM phone_darkchat_members WHERE sender = ?',
                [account.username],
            )
            for (let channel of channels) {
                returnstring.push(
                    'INSERT INTO phone_darkchat_members (channel_name, username) VALUES ' +
                        channel.channel_name +
                        ', ' +
                        channel.username +
                        ';',
                )
            }
            //Delete Account
            await GameDB.execute('DELETE FROM phone_darkchat_accounts WHERE phone_number = ?', [
                phonenumber,
            ])
            return returnstring.join('\n')
        } catch (error) {
            LogManager.error(error)
            return Error('Error while deleting Darkchat Account')
        }
    }

    async deleteInstagram(phonenumber: string): Promise<string | Error> {
        return Error('Not implemented')
    }
}
