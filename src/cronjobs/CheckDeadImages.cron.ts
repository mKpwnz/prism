import LogManager from '@prism/manager/LogManager';
import { PhonePhotosService } from '@prism/services/PhonePhotosService';
import { GameDB } from '@prism/sql/Database';
import { IPhonePhotos } from '@prism/sql/gameSchema/Phone.schema';
import axios from 'axios';

async function checkLinks(links: string[]): Promise<{ link: string; available: boolean }[]> {
    const batchSize = 10;
    let checkedCount = 0;
    const total = links.length;
    const availableLinks: { link: string; available: boolean }[] = [];

    LogManager.info(`Checking ${total} links...`);

    for (let i = 0; i < links.length; i += batchSize) {
        const batch = links.slice(i, i + batchSize);
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const promises = batch.map((link) =>
            axios
                .get(link)
                .then(() => {
                    checkedCount++;
                    return { link, available: true };
                })
                .catch(() => {
                    checkedCount++;
                    return { link, available: false };
                }),
        );

        const results = await Promise.allSettled(promises);
        const successfulResults = results
            .filter((result) => result.status === 'fulfilled')
            .map(
                (result) =>
                    (result as PromiseFulfilledResult<{ link: string; available: boolean }>).value,
            );
        availableLinks.push(...successfulResults);

        LogManager.info(`Checked ${checkedCount}/${total}`);
    }

    return availableLinks;
}
export async function checkDeadImages() {
    const [pictures] = await GameDB.query<IPhonePhotos[]>('SELECT * FROM phone_photos');
    const res = await checkLinks(
        pictures
            .filter((pic) => {
                try {
                    const url = new URL(pic.link);
                    return (
                        url.hostname.endsWith('.discordapp.com') &&
                        url.pathname.startsWith('/attachments') &&
                        !url.searchParams.has('ex')
                    );
                } catch (e) {
                    // Ignorieren Sie Links, die keine gültige URL sind
                    return false;
                }
            })
            .map((picture) => picture.link),
    );
    const unavailableCount = res.filter((result) => !result.available).length;
    const total = res.length;
    const unavailablePercentage = (unavailableCount / total) * 100;
    LogManager.info(`Percentage of unavailable pictures: ${unavailablePercentage.toFixed(2)}%`);
    let deletedCount = 0;
    for (const result of res) {
        if (!result.available) {
            LogManager.info(`Deleting ${result.link} (${deletedCount + 1}/${unavailableCount})...`);
            deletedCount++;
            await PhonePhotosService.deletePicture(result.link);
        }
    }
    LogManager.info(`Deleted ${deletedCount} images`);
}
