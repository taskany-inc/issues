import { sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

import { db } from '../connection/kysely';
import { QueryWithFilters } from '../../src/schema/common';
import { Role } from '../../generated/kysely/types';

interface GoalQueryParams {
    query?: QueryWithFilters;
    activityId: string;
    role: Role;
}

export const getGoalList = (params: GoalQueryParams) => {
    return db
        .selectFrom('Goal')
        .innerJoin('User as owner', 'owner.activityId', 'Goal.ownerId')
        .innerJoin('State as state', 'state.id', 'Goal.stateId')
        .innerJoin('Priority as priority', 'priority.id', 'Goal.priorityId')
        .leftJoinLateral(
            ({ selectFrom: selectFrom2 }) =>
                selectFrom2('Tag')
                    .selectAll('Tag')
                    .distinctOn('Tag.id')
                    .where('Tag.id', 'in', (qb) =>
                        qb.selectFrom('_GoalToTag').select('B').whereRef('A', '=', 'Goal.id'),
                    )
                    .as('tag'),
            (join) => join.onTrue(),
        )
        .leftJoinLateral(
            ({ selectFrom: selectFrom2 }) =>
                selectFrom2('User')
                    .selectAll('User')
                    .distinctOn('User.activityId')
                    .whereRef('User.activityId', 'in', (qb) =>
                        qb.selectFrom('_goalParticipants').select('A').whereRef('B', '=', 'Goal.id'),
                    )
                    .groupBy('User.id')
                    .as('participant'),
            (join) => join.onTrue(),
        )
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('GoalAchieveCriteria')
                    .leftJoin('Goal as criteriaGoal', 'GoalAchieveCriteria.criteriaGoalId', 'criteriaGoal.id')
                    .selectAll('GoalAchieveCriteria')
                    .select([
                        sql`
                        case
                            when "criteriaGoal" != null
                            then to_json("criteriaGoal")
                            else null
                        end
                    `.as('criteriaGoal'),
                    ])
                    .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                    .as('criteria'),
            (join) => join.onTrue(),
        )
        .selectAll('Goal')
        .select([
            sql<string>`concat("Goal"."projectId", '-', "Goal"."scopeId")::text`.as('_shortId'),
            jsonBuildObject({
                comments: sql<number>`(select count("Comment".id) from "Comment" where "Comment"."goalId" = "Goal".id)`,
            }).as('_count'),
            sql`(
            case
                when count(participant) > 0
                then array_agg(
                    json_build_object(
                        'activityId', participant."activityId",
                        'user', to_jsonb(participant)
                    )
                )
                else null
            end)`.as('participants'),
            sql`(case when count(tag) > 0 then array_agg(to_jsonb(tag)) else null end)`.as('tags'),
            sql`
            json_build_object(
                'activityId', owner."activityId",
                'user', to_jsonb(owner)
            )
        `.as('owner'),
            sql`to_jsonb(state)`.as('state'),
            sql`to_jsonb(priority)`.as('priority'),
            sql`(case when count(criteria) > 0 then array_agg(to_jsonb(criteria)) else null end)`.as('criteria'),
        ])
        .$if(params.query?.project != null && params.query.project.length > 0, (qb) =>
            qb.where('Goal.projectId', 'in', params.query?.project || []),
        )
        .$if(params.query?.owner != null && params.query.owner.length > 0, (qb) =>
            qb.where('Goal.ownerId', 'in', params.query?.owner || []),
        )
        .$if(params.query?.issuer != null && params.query.issuer.length > 0, (qb) =>
            qb.where('Goal.activityId', 'in', params.query?.issuer || []),
        )
        .$if(params.query?.priority != null && params.query.priority.length > 0, (qb) =>
            qb.where('Goal.priorityId', 'in', params.query?.priority || []),
        )
        .$if(params.query?.stateType != null && params.query.stateType.length > 0, (qb) =>
            qb.where('Goal.stateId', 'in', ({ selectFrom }) =>
                selectFrom('State')
                    .select('State.id')
                    .where('State.type', 'in', params.query?.stateType || []),
            ),
        )
        .$if(params.query?.state != null && params.query.state.length > 0, (qb) =>
            qb.where('Goal.stateId', 'in', params.query?.state || []),
        )
        .$if(params.query?.tag != null && params.query.tag.length > 0, (qb) =>
            qb.where('tag.id', 'in', params.query?.tag || []),
        )
        .$if(params.query?.participant != null && params.query.participant.length > 0, (qb) =>
            qb.where('participant.activityId', 'in', params.query?.participant || []),
        )
        .$if(params.query?.query != null && params.query.query.length > 0, (qb) =>
            qb.where(({ or, eb }) =>
                or([
                    eb('Goal.title', 'ilike', params.query?.query || ''),
                    eb('Goal.description', 'ilike', params.query?.query || ''),
                    eb('Goal.projectId', 'in', (qb) =>
                        qb
                            .selectFrom('Project')
                            .select('Project.id')
                            .where((eb) =>
                                eb.or([
                                    eb('Project.title', 'ilike', params.query?.query || ''),
                                    eb('Project.description', 'ilike', params.query?.query || ''),
                                ]),
                            ),
                    ),
                ]),
            ),
        )
        .$if(params.role === Role.USER, (qb) =>
            qb.where('Goal.projectId', 'in', ({ selectFrom }) =>
                selectFrom('Project')
                    .select('Project.id')
                    .where(({ eb, not, exists, selectFrom }) =>
                        eb.or([
                            eb('Project.activityId', '=', params.activityId),
                            eb(
                                'Project.id',
                                'in',
                                selectFrom('_projectAccess').select('B').where('A', '=', params.activityId),
                            ),
                            not(
                                exists(
                                    selectFrom('_projectAccess')
                                        .select('B')
                                        .where('_projectAccess.A', '=', params.activityId),
                                ),
                            ),
                        ]),
                    ),
            ),
        )
        .limit(30)
        .orderBy('Goal.updatedAt desc')
        .groupBy(['Goal.id', 'owner.id', 'state.id', 'priority.id']);
};
