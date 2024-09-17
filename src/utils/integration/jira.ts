import JiraApi from 'jira-client';

import { safelyParseJson } from '../safelyParseJson';

export enum AvatarSize {
    x1 = 16,
    x2 = 24,
    x3 = 32,
    x4 = 48,
}

export type Avatar<S extends AvatarSize, K extends string = `${S}x${S}`> = Record<K, string>;

export type JiraAvatar = Avatar<AvatarSize.x1> | Avatar<AvatarSize.x2> | Avatar<AvatarSize.x3> | Avatar<AvatarSize.x4>;

export interface JiraUser {
    active: boolean;
    displayName: string;
    emailAddress: string;
    key: string;
    name: string;
    timeZone: string;
    self: string;
    avatarUrls: JiraAvatar;
}

export interface JiraIssueStatus {
    self: string;
    description: string;
    iconUrl: string;
    name: string;
    id: string;
    statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
    };
}

export interface JiraProject {
    self: string;
    id: string;
    key: string;
    name: string;
    projectTypeKey: string;
    avatarUrls: JiraAvatar;
}

export interface JiraIssueType {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
    avatarId: number;
}

export interface JiraPriority {
    self: string;
    iconUrl: string;
    name: string;
    id: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    self: string;
    summary: string;
    description: string;
    creator: JiraUser;
    assignee: JiraUser;
    reporter: JiraUser;
    status: JiraIssueStatus;
    project: JiraProject;
    priority: JiraProject;
    issuetype: JiraIssueType;
}

interface JiraServiceConfig {
    url: string;
    user: string;
    password: string;
    apiVersion: string;
    positiveStatusNames: string;
    finishedCategory: JiraIssueStatus['statusCategory'] | null;
    mapStatusKey: Record<string, string>;
    mapStatusIdToColor: Record<string, string>;
}

const toCamelCase = (key: string): string => {
    // drop 'JIRA' prefix
    const [_namespace, noChanges, ...toChanges] = key.toLowerCase().split('_');

    if (toChanges.length) {
        return `${noChanges}${toChanges.map((v) => v[0].toUpperCase() + v.slice(1)).join('')}`;
    }

    return noChanges;
};

const requiredConfigFields: Array<keyof JiraServiceConfig> = ['url', 'user', 'password', 'apiVersion'];

const readJiraEnv = () => {
    const baseConfig: Partial<JiraServiceConfig> = {};
    try {
        const config = Object.keys(process.env)
            .filter((k) => k.startsWith('JIRA'))
            .reduce<JiraServiceConfig>((acc, jiraEnvKey) => {
                const configKey = toCamelCase(jiraEnvKey) as keyof JiraServiceConfig;
                const existingValue = process.env[jiraEnvKey];
                const val = existingValue ? safelyParseJson(existingValue) ?? existingValue : null;

                acc[configKey] = val;

                return acc;
            }, baseConfig as JiraServiceConfig);

        return config;
    } catch (error) {
        console.log(error);

        return baseConfig as JiraServiceConfig;
    }
};

const isDebugEnabled = process.env.NODE_ENV === 'development' && process.env.DEBUG?.includes('service:jira');
const config = readJiraEnv();
const isValidConfig = requiredConfigFields.every((k) => k in config && config[k] != null);

// @ts-ignore
class JiraService extends JiraApi {
    constructor(private _config: JiraServiceConfig, private _isEnabled = false) {
        super({
            protocol: 'https',
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            host: _config.url,
            username: _config.user,
            password: _config.password,
            apiVersion: _config.apiVersion,
            strictSSL: process.env.NODE_ENV === 'production',
        });
    }

    /** start overriding private instance methods */
    // @ts-ignore
    private async doRequest<T extends JiraApi.JsonResponse>(options: any): Promise<T> {
        if (isDebugEnabled) {
            console.log(options);
        }

        // @ts-ignore
        const res = await super.doRequest(options);
        if (isDebugEnabled) {
            console.table(res);
        }
        return res as unknown as T;
    }
    /** end overriding private instance methods */

    public checkStatusIsFinished(status: JiraIssueStatus | JiraIssueStatus['statusCategory']['id']) {
        if (this.config.finishedCategory != null) {
            if (typeof status === 'number') {
                return status === this.config.finishedCategory.id;
            }

            return Boolean(
                (status.statusCategory.key === this.config.finishedCategory.key ||
                    status.statusCategory.id === this.config.finishedCategory.id) &&
                    this.config.positiveStatusNames?.includes(status.name),
            );
        }

        return false;
    }

    get positiveStatuses() {
        return this.config.positiveStatusNames;
    }

    get config() {
        return this._config;
    }

    get isEnable() {
        return this._isEnabled;
    }
}

export const jiraService = new JiraService(config, isValidConfig);

const re = '(\\w+)-(\\d+)';

export const searchValueIsUrl = (val: string | URL): val is URL => {
    try {
        const url = new URL(val);

        return url.toString() === val;
    } catch (_e) {
        return false;
    }
};

const valueIsSimpleIssueKey = (value: string) => {
    return new RegExp(`^${re}$`).test(value);
};

const extractIssueKey = (value: string) => {
    return value.match(new RegExp(re))?.[0];
};

const jiraReservedCharacters = '+.,;?|*/%^$#@[]';

const escapeSearchString = (value: string) => {
    let escapedString = '';

    for (const char of value) {
        if (jiraReservedCharacters.includes(char)) {
            escapedString += `\\\\${char}`;
        } else {
            escapedString += char;
        }
    }

    return escapedString;
};

export const searchIssue = async (params: { value: string; limit: number }): Promise<Array<JiraIssue>> => {
    if (searchValueIsUrl(params.value) || valueIsSimpleIssueKey(params.value)) {
        const issueKey = extractIssueKey(params.value);

        if (issueKey) {
            const res = await jiraService.findIssue(issueKey);
            return [
                {
                    ...res,
                    ...res.fields,
                },
            ] as Array<JiraIssue>;
        }
    }

    const searchResults = await jiraService.searchJira(`summary ~ "${escapeSearchString(params.value)}"`, {
        maxResults: params.limit,
    });

    return searchResults.issues.map((val: { fields: any }) => ({
        ...val,
        ...val.fields,
    })) as Array<JiraIssue>;
};
