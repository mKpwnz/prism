export type V3coords = [number, number, number];
export type V4coords = [number, number, number, number];

export type TFiveMVehicleType = 'car' | 'air' | 'boat';

export type TFiveMGarage = {
    garageId: number;
    DisplayName: string;
    Coordinates: V3coords;
    ParkInCoordinates: V4coords[];
    ParkOutCoordinates: V3coords;
    VehicleType: TFiveMVehicleType;
};

export type TWeaponComponent = {
    name: string;
    hash: number;
    label: string;
};

export type TWeapon = {
    name: string;
    label: string;
    components: TWeaponComponent[];
    ammo?: { hash: number; label: string };
    tints?: {
        [key: string]: string;
    };
};
