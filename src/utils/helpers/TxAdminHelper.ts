import { TxAdminPlayerResponse } from '@interfaces/txadmin.interface';

export function isTxAdminPlayerResponse(obj: any): obj is TxAdminPlayerResponse {
    return 'serverTime' in obj && 'player' in obj;
}

/**
 * @description Maps the duration and unit to the TxAdmin format
 * @returns The duration in the TxAdmin format or null if it is invalid
 */
export function mapDurationToTxAdminFormat(duration: number | null, unit: string): string | null {
    if (unit === 'permanent') {
        return unit;
    }
    if (unit !== 'permanent' && !duration) {
        return null;
    }
    return `${duration} ${unit}`;
}
