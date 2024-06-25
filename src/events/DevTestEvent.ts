import { PhoneService } from '@prism/services/PhoneService';
import LogManager from '@prism/manager/LogManager';
import { PerformanceProfiler } from '@prism/class/PerformanceProfiler';
import S3Client from '@prism/clients/S3Client';

export default class DevTestEvent {
    public static async execute() {
        const profiler = new PerformanceProfiler('phoneService');
        profiler.addStep('getPhone');
        const phone = await PhoneService.getPhoneBySteamID('steam:11000014a99d40d');
        if (!phone) {
            LogManager.error('No phone found');
            return;
        }
        const data = await PhoneService.getPhoneDataByPhone(phone);
        profiler.addStep('postFetch');
        LogManager.debug('PHONE SERVICE DEBUGGING');
        if (!data) {
            LogManager.error('No data found');
            return;
        }

        const s3Response = await S3Client.uploadObjectAsJson(
            `phoneData_${data.phone.phone_number}_${Date.now()}`,
            data,
        );
        LogManager.debug('S3 RESPONSE', s3Response);
        await profiler.sendToConsole();
    }
}
