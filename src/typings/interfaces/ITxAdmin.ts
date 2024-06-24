export interface TxAdminActionHistory {
    id: string;
    type: 'ban' | 'warn';
    author: string;
    reason: string;
    ts: number;
    exp?: number;
    revokedBy?: string;
    revokedAt?: number;
}

export interface TxAdminPlayer {
    displayName: string;
    pureName: string;
    isRegistered: boolean;
    isConnected: boolean;
    ids: string[];
    hwids: string[];
    license: string | null;
    actionHistory: TxAdminActionHistory[];
    netid?: number;
    sessionTime?: number;
    tsJoined?: number;
    tsWhitelisted?: number;
    playTime?: number;
    notesLog?: string;
    notes?: string;
    oldIds?: string[];
    oldHwids?: string[];
    tsLastConnection?: number;
}

export interface TxAdminPlayerResponse {
    serverTime: number;
    player: TxAdminPlayer;
}

export interface TxAdminDatabaseWhitelistRequestsType {
    id: string;
    license: string;
    playerDisplayName: string;
    playerPureName: string;
    discordTag?: string;
    discordAvatar?: string;
    tsLastAttempt: number;
}

export interface TxAdminWhitelistRequests {
    cntTotal: number;
    cntFiltered: number;
    newest: number;
    totalPages: number;
    currPage: number;
    requests: TxAdminDatabaseWhitelistRequestsType[];
}

export interface TxAdminAuthResponse {
    name: string;
    permissions: string[];
    isMaster: boolean;
    isTempPassword: boolean;
    csrfToken: string;
}

export interface TxAdminApiResponse {
    success: boolean;
    actionId?: string;
}
