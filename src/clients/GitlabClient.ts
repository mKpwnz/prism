import { Gitlab } from '@gitbeaker/rest';

export class GitlabClient {
    public static readonly API = new Gitlab({
        host: process.env.GITLAB_HOST,
        token: process.env.GITLAB_TOKEN ?? '',
    });
}
