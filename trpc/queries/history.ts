import { sql } from 'kysely';

import { db } from '../../src/utils/db/connection/kysely';
import { ExtractTypeFromGenerated } from '../utils';
import {
    Goal,
    GoalAchieveCriteria,
    GoalHistory,
    Priority,
    Project,
    State,
    Tag,
    ExternalTask,
} from '../../src/utils/db/generated/kysely/types';
import { calcStatusColorForExternalTask } from '../../src/utils/db/calculatedGoalsFields';

import { Activity, getUserActivity } from './activity';
import { tagQuery } from './tag';
import { goalBaseQuery } from './goalV2';

interface HistoryQueryParams {
    goalId: string;
}

interface HisrotyRecord extends ExtractTypeFromGenerated<GoalHistory> {
    activity: Activity;
}

export const subjectToTableNameMap = {
    dependencies: true,
    project: true,
    tags: true,
    owner: true,
    participants: true,
    state: true,
    criteria: true,
    partnerProject: true,
    priority: true,
};

export type HistoryRecordSubject = { [K in keyof typeof subjectToTableNameMap]: string } & {
    title: string;
    description: string;
    estimate: string;
};

type RequestParamsBySubject = { [K in keyof HistoryRecordSubject]: { ids: string[]; sourceIdx: number[] } };

export type HistoryRecordAction = 'add' | 'change' | 'remove' | 'delete' | 'edit' | 'complete' | 'uncomplete';

type ExtendedGoal = ExtractTypeFromGenerated<Goal> & {
    state: ExtractTypeFromGenerated<State>;
    _shortId: string;
};

export interface HistoryRecordMeta {
    dependencies: Goal;
    project: ExtractTypeFromGenerated<Project>;
    tags: ExtractTypeFromGenerated<Tag>;
    owner: Activity;
    participants: Activity;
    state: ExtractTypeFromGenerated<State>;
    criteria: ExtractTypeFromGenerated<GoalAchieveCriteria> & {
        criteriaGoal: ExtendedGoal | null;
        externalTask: ExtractTypeFromGenerated<ExternalTask> | null;
    };
    partnerProject: ExtractTypeFromGenerated<Project>;
    priority: ExtractTypeFromGenerated<Priority>;
    title: string;
    description: string;
    estimate: string;
}

type HistoryValuesBySubject<T extends keyof HistoryRecordSubject, V = HistoryRecordMeta[T]> = {
    subject: T;
    previousValue: V | null;
    nextValue: V | null;
};

type HistoryRecord = {
    id: string;
    action: HistoryRecordAction;
    createdAt: Date;
} & (
    | HistoryValuesBySubject<'dependencies', HistoryRecordMeta['dependencies'][]>
    | HistoryValuesBySubject<'tags', HistoryRecordMeta['tags'][]>
    | HistoryValuesBySubject<'project' | 'partnerProject'>
    | HistoryValuesBySubject<'state'>
    | HistoryValuesBySubject<'owner' | 'participants'>
    | HistoryValuesBySubject<'criteria'>
    | HistoryValuesBySubject<'priority'>
    | HistoryValuesBySubject<'title' | 'description' | 'estimate', string>
);

export type HistoryRecordWithActivity = HistoryRecord & { activity: Activity };

export const castToSubject = (value: unknown): value is HistoryRecordWithActivity => {
    if (value != null && typeof value === 'object') {
        if ('subject' in value && value.subject != null && typeof value.subject === 'string') {
            return (
                value.subject in subjectToTableNameMap || ['title', 'description', 'estimate'].includes(value.subject)
            );
        }
    }

    return false;
};

const subjectToEnumValue = (subject: string): subject is keyof HistoryRecordSubject => {
    return subject in subjectToTableNameMap;
};

export const goalHistorySeparator = ', ';

export const historyQuery = ({ goalId }: HistoryQueryParams) =>
    db
        .selectFrom('GoalHistory')
        .innerJoinLateral(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('GoalHistory.activityId', '=', 'activity.id'),
        )
        .selectAll('GoalHistory')
        .select(({ fn }) => [fn.toJson('activity').as('activity')])
        .where('GoalHistory.goalId', '=', goalId)
        .orderBy('GoalHistory.createdAt asc')
        .$castTo<HisrotyRecord>();

export const extraDataForEachRecord = async <T extends HisrotyRecord>(
    history: T[],
): Promise<HistoryRecordWithActivity[]> => {
    const requestParamsBySubjects = history.reduce<RequestParamsBySubject>(
        (acc, { subject, previousValue, nextValue }, index) => {
            const allValues = (previousValue ?? '')
                .split(goalHistorySeparator)
                .concat((nextValue ?? '').split(goalHistorySeparator))
                .filter(Boolean);

            if (subjectToEnumValue(subject)) {
                acc[subject] = {
                    ids: (acc[subject]?.ids ?? []).concat(...allValues),
                    sourceIdx: (acc[subject]?.sourceIdx ?? []).concat(index),
                };
            }

            return acc;
        },
        {} as RequestParamsBySubject,
    );

    const historyWithMeta: HistoryRecordWithActivity[] = [];
    const needRequestForSubject = Object.keys(requestParamsBySubjects) as (keyof typeof requestParamsBySubjects)[];
    const replacedValueIdx = needRequestForSubject.map((subject) => requestParamsBySubjects[subject].sourceIdx).flat();

    if (needRequestForSubject.length) {
        const results: Array<
            Array<HistoryRecordMeta[Exclude<keyof HistoryRecordMeta, 'title' | 'description' | 'estimate'>]>
        > = await Promise.all(
            needRequestForSubject
                .map((subject) => {
                    const { ids } = requestParamsBySubjects[subject];
                    switch (subject) {
                        case 'dependencies':
                            return goalBaseQuery()
                                .where('Goal.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['dependencies']>();
                        case 'tags':
                            return tagQuery({ id: ids }).$castTo<HistoryRecordMeta['tags']>();
                        case 'owner':
                        case 'participants':
                            return getUserActivity()
                                .clearSelect()
                                .selectAll('Activity')
                                .select(({ fn }) => [fn.toJson('User').as('user'), fn.toJson('Ghost').as('ghost')])
                                .where('Activity.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['owner'] | HistoryRecordMeta['participants']>();
                        case 'state':
                            return db
                                .selectFrom('State')
                                .selectAll('State')
                                .where('State.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['state']>();
                        case 'project':
                        case 'partnerProject':
                            return db
                                .selectFrom('Project')
                                .selectAll('Project')
                                .where('Project.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['project'] | HistoryRecordMeta['partnerProject']>();
                        case 'criteria':
                            return db
                                .selectFrom('GoalAchieveCriteria')
                                .leftJoin(
                                    () => goalBaseQuery().as('criteriaGoal'),
                                    (join) => join.onRef('GoalAchieveCriteria.criteriaGoalId', '=', 'criteriaGoal.id'),
                                )
                                .leftJoinLateral(
                                    ({ selectFrom }) =>
                                        selectFrom('ExternalTask')
                                            .selectAll()
                                            .whereRef('GoalAchieveCriteria.externalTaskId', '=', 'ExternalTask.id')
                                            .as('externalTask'),
                                    (join) => join.onTrue(),
                                )
                                .selectAll('GoalAchieveCriteria')
                                .select((eb) => [
                                    eb
                                        .case()
                                        .when('GoalAchieveCriteria.criteriaGoalId', 'is not', null)
                                        .then(sql`to_json("criteriaGoal")`)
                                        .else(null)
                                        .end()
                                        .as('criteriaGoal'),
                                    eb
                                        .case()
                                        .when('GoalAchieveCriteria.externalTaskId', 'is not', null)
                                        .then(sql`to_json("externalTask")`)
                                        .else(null)
                                        .end()
                                        .as('externalTask'),
                                ])
                                .where('GoalAchieveCriteria.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['criteria']>();
                        case 'priority':
                            return db
                                .selectFrom('Priority')
                                .selectAll('Priority')
                                .where('Priority.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['priority']>();
                        default:
                            throw new Error('query for history record is undefined');
                    }
                })
                .map((query) => query.execute()),
        );

        const meta: Map<string, (typeof results)[number][number]> = new Map(
            results.flat().map((value) => [value.id, value]),
        );

        history.forEach((item, index) => {
            const valueCanBeArray = ['dependencies', 'tags', 'estimates'].includes(item.subject);
            let prev;
            let next;

            if (valueCanBeArray) {
                prev = item.previousValue?.split(goalHistorySeparator).map((id) => meta.get(id)) ?? null;
                next = item.nextValue?.split(goalHistorySeparator).map((id) => meta.get(id)) ?? null;
            } else {
                prev = item.previousValue ? meta.get(item.previousValue) : null;
                next = item.nextValue ? meta.get(item.nextValue) : null;
            }

            if (castToSubject(item)) {
                if (replacedValueIdx.includes(index)) {
                    const extendeRecord: HistoryRecordWithActivity = {
                        ...item,
                        previousValue: prev || null,
                        nextValue: next || null,
                    };
                    historyWithMeta[index] = extendeRecord;
                } else {
                    historyWithMeta[index] = item;
                }
            }
        });
    }

    // update state colors of jira tasks in criteria changes records

    historyWithMeta.forEach((record) => {
        if (record.subject === 'criteria') {
            if (record.nextValue?.externalTask != null) {
                record.nextValue.externalTask = calcStatusColorForExternalTask(record.nextValue.externalTask);
            }

            if (record.previousValue?.externalTask != null) {
                record.previousValue.externalTask = calcStatusColorForExternalTask(record.previousValue.externalTask);
            }
        }
    });

    return historyWithMeta;
};
