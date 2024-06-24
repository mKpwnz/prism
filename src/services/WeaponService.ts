import GameserverClient from '@prism/clients/GameserverClient';
import { TWeapon } from '@prism/typings/interfaces/IFiveM';

export class WeaponService {
    public static async getAllWeapons(): Promise<TWeapon[]> {
        const weapons = await GameserverClient.getAllWeapons();
        if (weapons instanceof Error) throw weapons;
        return weapons;
    }

    public static async doesWeaponExists(weaponName: string): Promise<boolean> {
        const weapons = await this.getAllWeapons();
        return weapons.some((weapon) => weapon.name.toUpperCase() === weaponName.toUpperCase());
    }

    public static async validateWeaponName(weaponName: string): Promise<string> {
        const weapons = await this.getAllWeapons();
        return (
            weapons.find((weapon) => weapon.name.toUpperCase() === weaponName.toUpperCase())
                ?.name ?? ''
        );
    }
}
