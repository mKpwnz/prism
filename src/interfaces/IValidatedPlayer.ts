export interface IValidatedPlayer {
    steamnames: {
        current: string;
        atFirstLogin: string;
    };
    identifiers: {
        steam: string;
        license: string;
        liveid: string | null;
        xblid: string | null;
        discord: string | null;
        playerip: string;
    };
    metadata: {
        isPlayerOnline: boolean;
        lastLogin: Date;
        currentID: number;
    };
    playerdata: {
        fullname: string;
        firstname: string;
        lastname: string;
        group: string;
        craftingLevel: number;
        phonenumber: string;
        accounts: {
            bank: number;
            money: number;
            black_money: number;
        };
        job: {
            name: string;
            grade: number;
            nameLabel: string;
            gradeLabel: string;
            fraksperre: Date;
        };
    };
}
