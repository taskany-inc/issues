import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { JiraIssue, searchIssue, jiraService } from '../../src/utils/integration/jira';
import { ExternalTask } from '../../generated/kysely/types';
import { ExtractTypeFromGenerated } from '../utils';

const jiraIssueToExternalTask = (
    issue: JiraIssue,
): Omit<ExtractTypeFromGenerated<ExternalTask>, 'createdAt' | 'id' | 'updatedAt'> => {
    return {
        externalKey: issue.key,
        externalId: issue.id,
        title: issue.summary,
        state: issue.status.name,
        stateCategoryId: issue.status.statusCategory.id,
        stateCategoryName: issue.status?.statusCategory.name,
        stateId: issue.status.statusCategory?.id ? String(issue.status.statusCategory?.id) : issue.status.id,
        stateColor: issue.status.statusCategory?.colorName ?? null,
        stateIconUrl: issue.status.iconUrl,
        project: issue.project.key,
        projectId: issue.project.id,
        type: issue.issuetype.name,
        typeIconUrl: issue.issuetype.iconUrl,
        typeId: issue.issuetype.id,
        ownerEmail: issue.reporter.emailAddress,
        ownerId: issue.reporter.key,
        ownerName: issue.reporter.displayName || issue.reporter.name,
        resolution: issue.resolution?.name ?? null,
        resolutionId: issue.resolution?.id ?? null,
    };
};

export const jira = router({
    isEnable: protectedProcedure.query(async () => {
        return Promise.resolve(jiraService.isEnable);
    }),
    search: protectedProcedure
        .input(
            z.object({
                value: z.string(),
                limit: z.number(),
            }),
        )
        .query(async ({ input }) => {
            const existsTaskData = await searchIssue(input).then((res) => res.map(jiraIssueToExternalTask));

            return existsTaskData;
        }),
});
