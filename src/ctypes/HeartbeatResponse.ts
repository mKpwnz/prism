import { HeartbeatEntry } from './HeartbeatEntry'

export type HeartbeatResponse = {
    heartbeatList: {
        [key: number]: HeartbeatEntry[]
    }
    uptimeList: {
        [key: string]: number
    }
}
