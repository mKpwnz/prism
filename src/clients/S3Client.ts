import Config from '@prism/Config';
import axios from 'axios';
import { Client, ItemBucketMetadata } from 'minio';
import { Sentry } from '@prism/Bot';

export default class S3Client {
    public static s3client: Client = new Client({
        endPoint: Config.ENV.MINIO_ENDPOINT,
        port: Config.ENV.MINIO_PORT,
        useSSL: Config.ENV.MINIO_SSL,
        accessKey: Config.ENV.MINIO_ACCESSKEY,
        secretKey: Config.ENV.MINIO_SECRETKEY,
        region: Config.ENV.MINIO_REGION,
    });

    public static async uploadFromUrl(
        bucket: string,
        objectName: string,
        metadata: ItemBucketMetadata,
        url: string,
    ) {
        const attachResp = await axios.get(url, { responseType: 'stream' });
        try {
            return await this.s3client.putObject(
                bucket,
                objectName,
                attachResp.data,
                attachResp.data.byteLength,
                metadata,
            );
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    bucket,
                    objectName,
                    metadata,
                    url,
                },
            });
            return undefined;
        }
    }

    public static async uploadObjectAsJson(filename: string, data: Object) {
        const bucket = 'prism-temp';
        const objectName = `${filename}.json`;
        const metadata = {
            'Content-Type': 'application/json',
        };
        try {
            const response = await S3Client.s3client.putObject(
                bucket,
                objectName,
                JSON.stringify(data),
                undefined,
                metadata,
            );
            return {
                path: `https://s3.immortaldev.eu/prism-temp/${objectName}`,
                response,
            };
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    bucket,
                    objectName,
                    metadata,
                },
            });
            return undefined;
        }
    }

    public static async deleteFile(bucket: string, objectName: string) {
        await this.s3client.removeObject(bucket, objectName);
    }
}
