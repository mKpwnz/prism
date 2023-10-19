import { HeartbeatEntry } from './HeartbeatEntry'

/**
 * @typedef HeartbeatResponse
 */
export type HeartbeatResponse = {
    heartbeatList: {
        [key: number]: HeartbeatEntry[]
    }
    uptimeList: {
        [key: string]: number
    }
}
