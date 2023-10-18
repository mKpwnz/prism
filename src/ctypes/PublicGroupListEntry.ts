import { PGLMonitor } from './PGLMonitor'

export type PublicGroupListEntry = {
    id: number
    name: string
    weight: number
    monitorList: PGLMonitor[]
}
