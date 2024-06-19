import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { Cache } from '@prism/class/Cache';
import { TFiveMGarage, TWeapon } from '@prism/interfaces/IFiveM';
import LogManager from '@prism/manager/LogManager';
import axios from 'axios';

export default class GameserverClient {
    private static endpoint = `http://${Config.ENV.GAMESERVER_API_HOST}:${Config.ENV.GAMESERVER_API_PORT}/`;

    public static async getAllGarages(): Promise<TFiveMGarage[] | Error> {
        let garages = await Cache.get<TFiveMGarage[]>('FiveMGarages');
        if (!garages) {
            try {
                const response = await axios.get(`${GameserverClient.endpoint}api/getAllGarages`);
                if (response.status !== 200) {
                    return new Error(`Failed to fetch garages from the gameserver`);
                }

                if (!Array.isArray(response.data)) {
                    return new Error('Unexpected response from the gameserver');
                }

                const TempGarages: TFiveMGarage[] = [];
                for (const garage of response.data) {
                    if (!('DisplayName' in garage && 'VehicleType' in garage)) {
                        return new Error('Unexpected response from the gameserver');
                    }
                    TempGarages.push({ garageId: response.data.indexOf(garage), ...garage });
                }
                garages = TempGarages;
                await Cache.set('FiveMGarages', TempGarages);
            } catch (error: any) {
                Sentry.captureException(error);
                LogManager.error(error);
                return new Error(`Failed to fetch garages from the gameserver: ${error.message}`);
            }
        }
        return garages ?? [];
    }

    public static async getAllWeapons(): Promise<TWeapon[] | Error> {
        let weapons = await Cache.get<TWeapon[]>('FiveMWeapons');
        if (!weapons) {
            try {
                const response = await axios.get(`${GameserverClient.endpoint}api/getAllWeapons`);
                if (response.status !== 200) {
                    return new Error(`Failed to fetch weapons from the gameserver`);
                }

                if (!Array.isArray(response.data)) {
                    return new Error('Unexpected response from the gameserver');
                }

                const TempWeapons: TWeapon[] = [];
                for (const weapon of response.data) {
                    if (!('name' in weapon && 'label' in weapon)) {
                        return new Error('Unexpected response from the gameserver');
                    }
                    TempWeapons.push(weapon);
                }
                weapons = TempWeapons;
                await Cache.set('FiveMWeapons', TempWeapons);
            } catch (error: any) {
                Sentry.captureException(error);
                LogManager.error(error);
                return new Error(`Failed to fetch weapons from the gameserver: ${error.message}`);
            }
        }
        return weapons ?? [];
    }
}
