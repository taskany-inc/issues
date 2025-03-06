import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { JiraIssue, searchIssue, jiraService, JiraUser } from '../../src/utils/integration/jira';
import { ExternalTask } from '../../src/utils/db/generated/kysely/types';
import { ExtractTypeFromGenerated } from '../utils';

const jiraIssueToExternalTask = (
    issue: JiraIssue,
): Omit<ExtractTypeFromGenerated<ExternalTask>, 'createdAt' | 'id' | 'updatedAt'> => {
    const { key, id, summary, status, project, creator, reporter, assignee, resolution, issuetype } = issue;

    const creatorOrReporter = [reporter, creator].find((val) => val != null) || ({} as JiraUser);

    return {
        externalKey: key,
        externalId: id,
        title: summary,
        state: status.name,
        stateCategoryId: status.statusCategory.id,
        stateCategoryName: status?.statusCategory.name,
        stateId: status.statusCategory?.id ? String(status.statusCategory?.id) : status.id,
        stateColor: status.statusCategory?.colorName ?? null,
        stateIconUrl: status.iconUrl,
        project: project.key,
        projectId: project.id,
        type: issuetype.name,
        typeIconUrl: issuetype.iconUrl,
        typeId: issuetype.id,
        ownerEmail: creatorOrReporter?.emailAddress ?? null,
        ownerId: creatorOrReporter?.key ?? null,
        ownerName: creatorOrReporter?.displayName ?? creatorOrReporter?.name ?? null,
        creatorEmail: creatorOrReporter?.emailAddress ?? null,
        creatorId: creatorOrReporter?.key ?? null,
        creatorName: creatorOrReporter?.displayName ?? creatorOrReporter?.name ?? null,
        assigneeEmail: assignee?.emailAddress ?? null,
        assigneeId: assignee?.key ?? null,
        assigneeName: assignee?.displayName ?? assignee?.name ?? null,
        resolution: resolution?.name ?? null,
        resolutionId: resolution?.id ?? null,
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
