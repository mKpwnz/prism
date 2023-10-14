import { EServerStatus } from '@enums/EServerStatus'

export type HeartbeatEntry = {
    status: EServerStatus
    time: string
    msg: string
    ping: string | null
}
