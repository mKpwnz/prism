import { TxAdminPlayerResponse, TxAdminWhitelistRequests } from '@interfaces/ITxAdmin';

export function isTxAdminPlayerResponse(obj: any): obj is TxAdminPlayerResponse {
    return 'serverTime' in obj && 'player' in obj;
}

export function isTxAdminWhitelistRequests(data: any): data is TxAdminWhitelistRequests {
    return data && typeof data === 'object' && 'requests' in data;
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
