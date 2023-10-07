import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import axios from 'axios'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class ServerStatus extends Command {
    constructor() {
        super(true)
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
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
    getEmoteForStatus(status: EServerStatus): string {
        var emote = ''
        switch (status) {
            case EServerStatus.DOWN:
                emote = ':red_circle:'
                break
            case EServerStatus.UP:
                emote = ':green_circle:'
                break
            case EServerStatus.PENDING:
                emote = ':yellow_circle:'
                break
            case EServerStatus.MAINTENANCE:
                emote = ':blue_circle:'
                break
        }
        return emote
    }
    async getAgregatedData(): Promise<DiscordResponseGroupe[]> {
        var res: DiscordResponseGroupe[] = []
        const pglRes: publicGroupListEntry[] = await axios
            .get('https://status.immortaldev.eu/api/status-page/9t7abvczql56qa629fkejnfg2dyl072r', {
                timeout: 2500,
            })
            .then((res) => res.data['publicGroupList'])
            .catch((err) => {
                LogManager.error(err)
                return []
            })
        const hbdRes: heartbeatResponse = await axios
            .get('https://status.immortaldev.eu/api/status-page/heartbeat/9t7abvczql56qa629fkejnfg2dyl072r', {
                timeout: 2500,
            })
            .then((res) => res.data)
            .catch((err) => {
                LogManager.error(err)
                return []
            })

        pglRes.forEach((pglEntry) => {
            var DiscordResponseList: DiscordResponse[] = []
            pglEntry.monitorList.forEach((monitor) => {
                var hbdEntry = hbdRes.heartbeatList[monitor.id]
                var dr: DiscordResponse = {
                    name: monitor.name,
                    status: hbdEntry[hbdEntry.length - 1].status,
                    uptime: Number((hbdRes.uptimeList[`${monitor.id}_24`] * 100).toFixed(2)),
                    print: '',
                }
                dr.print = `${this.getEmoteForStatus(dr.status)} ${dr.name} - ${dr.uptime}%\n`
                DiscordResponseList.push(dr)
            })
            res.push({ name: pglEntry.name, member: DiscordResponseList })
        })

        return res
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        var embed = this.CommandEmbed
        const EmbedData = await this.getAgregatedData()

        embed.setTitle('Serverstatus')
        if (EmbedData.length === 0) {
            embed.setDescription('Es ist ein Fehler beim Abrufen der Daten aufgetreten!')
        } else {
            embed.setDescription(
                `${this.getEmoteForStatus(EServerStatus.UP)} = Online\n${this.getEmoteForStatus(
                    EServerStatus.DOWN,
                )} = Offline\n${this.getEmoteForStatus(
                    EServerStatus.PENDING,
                )} = Wird gestartet / Fehlerhaft\n${this.getEmoteForStatus(
                    EServerStatus.MAINTENANCE,
                )} = Im Wartungsmodus\n\n`,
            )
            EmbedData.forEach((group) => {
                var print = ''
                group.member.forEach((member) => {
                    print += member.print
                })
                embed.addFields({ name: group.name, value: print })
            })
            embed.setImage(Config.Pictures.WHITESPACE)
        }
        interaction.reply({ content: ' ', embeds: [embed] })
    }
}

enum EServerStatus {
    DOWN = 0,
    UP = 1,
    PENDING = 2,
    MAINTENANCE = 3,
}
type DiscordResponse = {
    status: EServerStatus
    name: string
    uptime: number
    print: string
}
type DiscordResponseGroupe = {
    name: string
    member: DiscordResponse[]
}
type pglMonitor = {
    id: number
    name: string
    sendUrl: any
    type: string
}
type publicGroupListEntry = {
    id: number
    name: string
    weight: number
    monitorList: pglMonitor[]
}
type heartbeatResponse = {
    heartbeatList: {
        [key: number]: hearbeatEntry[]
    }
    uptimeList: {
        [key: string]: number
    }
}
type hearbeatEntry = {
    status: EServerStatus
    time: string
    msg: string
    ping: string | null
}
