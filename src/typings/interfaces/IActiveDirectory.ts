export interface IADUser {
    dn: string;
    cn: string;
    distinguishedName: string;
    sAMAccountName: string;
    userPrincipalName: string;
    mail: string;
    userDiscordId: string;
    userSteamId: string;
    memberOf: string[];
    memberOfpretty: string[];
    msExchHomeServerName: string;
}
