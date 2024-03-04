import Config from '@prism/Config';
import axios from 'axios';
import { Client, ItemBucketMetadata } from 'minio';

export default class S3Client {
    private static s3client: Client = new Client({
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
        return this.s3client.putObject(
            bucket,
            objectName,
            attachResp.data,
            attachResp.data.byteLength,
            metadata,
        );
    }

    public static async deleteFile(bucket: string, objectName: string) {
        await this.s3client.removeObject(bucket, objectName);
    }
}
