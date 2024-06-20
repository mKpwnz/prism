import { RowDataPacket } from 'mysql2';

export interface IVehicle extends RowDataPacket {
    owner: string;
    plate: string;
    garage: number;
    impounder: number;
    vehicle?: string | null;
    type?: string | null;
    job?: string | null;
    kofferraum?: string | null;
    handschuhfach?: string | null;
    inserted: Date;
    updated: Date;
}

export interface IUndergroundTuning extends RowDataPacket {
    plate: string;
    qAntilag: boolean;
    qWegfahrsperre: string | null;
    qFlamethrowerKit: boolean;
    qRGBLightKit: boolean;
    qLachgaseinspritzung: boolean;
    qLachgasentluftung: boolean;
    qRadarScrambler: boolean;
    qLuftfahrwerk: boolean;
}
