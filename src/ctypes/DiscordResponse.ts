import { EServerStatus } from '@enums/EServerStatus'

export type DiscordResponse = {
    status: EServerStatus
    name: string
    uptime: number
    print: string
}
