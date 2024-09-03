import JiraApi from 'jira-client';

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
    statusCategory?: {
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

const isDebugEnabled = process.env.NODE_ENV === 'development' && process.env.DEBUG?.includes('service:jira');

// @ts-ignore
class JiraService extends JiraApi {
    // @ts-ignore
    private async doRequest(options: any) {
        if (isDebugEnabled) {
            console.log(options);
        }

        // @ts-ignore
        const res = await super.doRequest(options);
        if (isDebugEnabled) {
            console.table(res);
        }
        return res;
    }
}

export const jiraService = new JiraService({
    protocol: 'https',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    host: process.env.JIRA_URL!,
    username: process.env.JIRA_USER,
    password: process.env.JIRA_PASSWORD,
    apiVersion: process.env.JIRA_API_VERSION,
    strictSSL: process.env.NODE_ENV === 'production',
});

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
