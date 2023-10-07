import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import axios from 'axios'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { convert, valid } from 'metric-parser'

export class ServerStatus extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
            Config.Discord.Channel.WHOIS_LIMITED,
            Config.Discord.Channel.WHOIS_TEBEX,
            Config.Discord.Channel.WHOIS_TEBEXOLD,
            Config.Discord.Channel.WHOIS_RENAME,
            Config.Discord.Channel.WHOIS_ADMIN,
            Config.Discord.Channel.WHOIS_FRAKTIONEN,
            Config.Discord.Channel.WHOIS_NOTICE,
            Config.Discord.Channel.WHOIS_ADMIN,
        ]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_MOD,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(
            new SlashCommandBuilder().setName('serverstatus').setDescription('Gibt den aktuellen Serverstatus zurück!'),
            this,
        )
    }
    async processStatus(responseData: string) {}
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction

        const statusPageData = await axios
            .get('https://status.immortaldev.eu/api/status-page/9t7abvczql56qa629fkejnfg2dyl072r22222')
            .then((res) => res.data)
            .catch((err) => null)
        const heartbeat = await axios
            .get('https://status.immortaldev.eu/api/status-page/heartbeat/9t7abvczql56qa629fkejnfg2dyl072r22222')
            .then((res) => res.data)
            .catch((err) => null)

        interaction.reply('Pong!')
    }
}

enum EServerStatus {
    DOWN = 0,
    UP = 1,
    PENDING = 2,
    MAINTENANCE = 3,
}

interface ServerStatusResponse {
    name: string
    type: string
    url: string
    hostname: string
    port: number
    status: EServerStatus
}
