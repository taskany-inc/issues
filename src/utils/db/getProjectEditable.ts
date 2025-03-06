import { sql } from 'kysely';

import { Role } from './generated/kysely/types';
import { db } from './connection/kysely';

export const getProjectEditableSql = (activityId: string, role: Role) => {
    return sql<boolean>`(
        ${sql.val(role === Role.ADMIN)}
        OR (
            "Project"."activityId" = ${activityId}
            OR EXISTS(
                SELECT "A" FROM "_projectParticipants" 
                WHERE "B" = "Project"."id" AND "A" = ${activityId}
            )
        ) AND NOT "Project"."personal"
        OR EXISTS(
            WITH RECURSIVE parent_chain AS (
                SELECT "A" AS parent_id
                FROM "_parentChildren"
                WHERE "B" = "Project"."id"
                
                UNION
                
                SELECT "_parentChildren"."A" AS parent_id
                FROM "_parentChildren"
                JOIN parent_chain ON "_parentChildren"."B" = parent_chain.parent_id
            )
            SELECT * FROM "Project" AS parent_project
            WHERE parent_project.id IN (SELECT parent_id FROM parent_chain)
            AND (
                parent_project."activityId" = ${activityId}
                OR EXISTS(
                    SELECT "A" FROM "_projectParticipants" 
                    WHERE "B" = parent_project."id" AND "A" = ${activityId}
                )
            ) AND NOT parent_project."personal"
        )
    )`;
};

export const getProjectsEditableStatus = async (
    projectIds: string[],
    activityId: string,
    role: Role,
): Promise<Map<string, boolean>> => {
    if (!projectIds.length) {
        return new Map();
    }

    const editableResults = await db
        .selectFrom('Project')
        .select(['Project.id', getProjectEditableSql(activityId, role).as('_isEditable')])
        .where('Project.id', 'in', projectIds)
        .execute();

    return new Map(editableResults.map((result) => [result.id, result._isEditable]));
};
