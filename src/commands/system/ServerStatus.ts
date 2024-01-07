import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { DiscordResponse, DiscordResponseGroupe } from '@ctypes/Discord';
import { HeartbeatResponse, PublicGroupListEntry } from '@ctypes/Monitoring';
import { EENV } from '@enums/EENV';
import { EServerStatus } from '@enums/EServerStatus';
import { IEmbedField } from '@interfaces/IEmbedField';
import LogManager from '@utils/Logger';
import axios from 'axios';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class ServerStatus extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;

        RegisterCommand(
            new SlashCommandBuilder()
                .setName('serverstatus')
                .setDescription('Gibt den aktuellen Serverstatus zurück!'),
            this,
        );
    }

    private static getEmoteForStatus(status: EServerStatus): string {
        let emote;
        switch (status) {
            case EServerStatus.DOWN:
                emote = ':red_circle:';
                break;
            case EServerStatus.UP:
                emote = ':green_circle:';
                break;
            case EServerStatus.PENDING:
                emote = ':yellow_circle:';
                break;
            case EServerStatus.MAINTENANCE:
                emote = ':blue_circle:';
                break;
            default:
                emote = ':question:';
                break;
        }
        return emote;
    }

    // TODO: Refactor this
    async getAggregatedData(): Promise<DiscordResponseGroupe[]> {
        const res: DiscordResponseGroupe[] = [];
        const pglRes: PublicGroupListEntry[] = await axios
            .get('https://status.immortaldev.eu/api/status-page/9t7abvczql56qa629fkejnfg2dyl072r', {
                timeout: 2500,
            })
            .then((statusRes) => statusRes.data.publicGroupList)
            .catch((err) => {
                LogManager.error(err);
                return [];
            });

        const hbdRes: HeartbeatResponse = await axios
            .get(
                'https://status.immortaldev.eu/api/status-page/heartbeat/9t7abvczql56qa629fkejnfg2dyl072r',
                {
                    timeout: 2500,
                },
            )
            .then((heartbeatRes) => heartbeatRes.data)
            .catch((err) => {
                LogManager.error(err);
                return [];
            });

        pglRes.forEach((pglEntry) => {
            const DiscordResponseList: DiscordResponse[] = [];
            pglEntry.monitorList.forEach((monitor) => {
                const hbdEntry = hbdRes.heartbeatList[monitor.id];
                const dr: DiscordResponse = {
                    name: monitor.name,
                    status: hbdEntry[hbdEntry.length - 1].status,
                    uptime: Number((hbdRes.uptimeList[`${monitor.id}_24`] * 100).toFixed(2)),
                    print: '',
                };
                dr.print = `${ServerStatus.getEmoteForStatus(dr.status)} ${dr.name} - ${
                    dr.uptime
                }%\n`;
                DiscordResponseList.push(dr);
            });
            res.push({ name: pglEntry.name, member: DiscordResponseList });
        });

        return res;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const EmbedData = await this.getAggregatedData();

        let description = '';
        const embedFields: IEmbedField[] = [];

        if (EmbedData.length === 0) {
            description = 'Es ist ein Fehler beim Abrufen der Daten aufgetreten!';
        } else {
            description = `${ServerStatus.getEmoteForStatus(
                EServerStatus.UP,
            )} = Online\n${ServerStatus.getEmoteForStatus(
                EServerStatus.DOWN,
            )} = Offline\n${ServerStatus.getEmoteForStatus(
                EServerStatus.PENDING,
            )} = Wird gestartet / Fehlerhaft\n${ServerStatus.getEmoteForStatus(
                EServerStatus.MAINTENANCE,
            )} = Im Wartungsmodus\n\n`;

            EmbedData.forEach((group) => {
                let print = '';
                group.member.forEach((member) => {
                    print += member.print;
                });
                embedFields.push({ name: group.name, value: print });
            });
        }

        await this.replyWithEmbed({
            interaction,
            title: 'Serverstatus',
            fields: embedFields,
            description,
        });
    }
}
