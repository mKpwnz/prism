import Config from '@Config';
import { Gitlab } from '@gitbeaker/rest';

export class GitlabClient {
    public static readonly API = new Gitlab({
        host: Config.ENV.GITLAB_HOST,
        token: Config.ENV.GITLAB_TOKEN,
    });
}
