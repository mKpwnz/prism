import { PGLMonitor } from './PGLMonitor';

/**
 * @typedef PublicGroupListEntry
 */
export type PublicGroupListEntry = {
    id: number;
    name: string;
    weight: number;
    monitorList: PGLMonitor[];
};
