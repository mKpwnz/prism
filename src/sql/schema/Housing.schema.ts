import { RowDataPacket } from 'mysql2';

export interface IHousing extends RowDataPacket {
    house: string;
    identifier?: string;
    citizenid?: string;
    insideId?: string;
    keyholders?: string;
    decorations?: string;
    stash?: string;
    houseID?: string;
    outfit?: string;
    logout?: string;
    decorateStash?: string;
    charge?: string;
    credit?: string;
    creditPrice?: string;
}

export interface IHouseLocation extends RowDataPacket {
    id: number;
    name: string;
    label?: string;
    coords?: string;
    owned?: boolean;
    houseID?: string;
    price?: number;
    tier?: string;
    garage?: {
        x: number;
        y: number;
        z: number;
        h: number;
    };
    creator?: string;
    mlo?: string;
    ipl?: string;
    garageShell?: string;
}

export interface IHouseLocationCoords {
    cam: {
        yaw: number;
        x: number;
        y: number;
        z: number;
        h: number;
    };
    interiorCoords: {
        x: number;
        y: number;
        z: number;
    };
    PolyZone: {
        minZ: number;
        maxZ: number;
        usePolyZone: boolean;
        points: {
            x: number;
            y: number;
        }[];
    };
    enter: {
        x: number;
        y: number;
        z: number;
    };
}
