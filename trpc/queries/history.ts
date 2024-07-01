import { sql } from 'kysely';

import { db } from '../connection/kysely';
import { ExtractTypeFromGenerated } from '../utils';
import { Goal, GoalAchieveCriteria, GoalHistory, Priority, Project, State, Tag } from '../../generated/kysely/types';

import { Activity, getUserActivity } from './activity';
import { tagQuery } from './tag';

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

export interface HistoryRecordMeta {
    dependencies: ExtractTypeFromGenerated<Goal> & {
        state: ExtractTypeFromGenerated<State>;
        _shortId: string;
    };
    project: ExtractTypeFromGenerated<Project>;
    tags: ExtractTypeFromGenerated<Tag>;
    owner: Activity;
    participants: Activity;
    state: ExtractTypeFromGenerated<State>;
    criteria: ExtractTypeFromGenerated<GoalAchieveCriteria> & { criteriaGoal: HistoryRecordMeta['dependencies'] };
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

type HistoryRecord =
    | {
          id: string;
          action: HistoryRecordAction;
          createdAt: Date;
      } & (
          | HistoryValuesBySubject<'dependencies', HistoryRecordMeta['dependencies'][]>
          | HistoryValuesBySubject<'tags', HistoryRecordMeta['tags'][]>
          | HistoryValuesBySubject<'participants'>
          | HistoryValuesBySubject<'project'>
          | HistoryValuesBySubject<'partnerProject'>
          | HistoryValuesBySubject<'state'>
          | HistoryValuesBySubject<'owner'>
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

const goalHistorySeparator = ', ';

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
        .$castTo<HisrotyRecord>();

export const extraDataForEachRecord = async (history: HisrotyRecord[]): Promise<HistoryRecordWithActivity[]> => {
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
        const results = await Promise.all(
            needRequestForSubject
                .map((subject) => {
                    const { ids } = requestParamsBySubjects[subject];
                    switch (subject) {
                        case 'dependencies':
                            return db
                                .selectFrom('Goal')
                                .innerJoin('State', 'State.id', 'Goal.stateId')
                                .selectAll('Goal')
                                .select(({ fn, val, cast }) => [
                                    fn('concat', ['Goal.projectId', cast(val('-'), 'text'), 'Goal.scopeId']).as(
                                        '_shortId',
                                    ),
                                    sql`"State"`.as('state'),
                                ])
                                .where('Goal.id', 'in', ids)
                                .$castTo<HistoryRecordMeta['dependencies']>();
                        case 'tags':
                            return tagQuery({ id: ids }).$castTo<HistoryRecordMeta['tags']>();
                        case 'owner':
                        case 'participants':
                            return getUserActivity()
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
                                    ({ selectFrom }) =>
                                        selectFrom('Goal')
                                            .innerJoin('State', 'State.id', 'Goal.stateId')
                                            .selectAll('Goal')
                                            .select(({ fn, val, cast }) => [
                                                fn('concat', [
                                                    'Goal.projectId',
                                                    cast<string>(val('-'), 'text'),
                                                    'Goal.scopeId',
                                                ]).as('_shortId'),
                                                sql`"State"`.as('state'),
                                            ])
                                            .as('criteriaGoal'),
                                    (join) => join.onRef('GoalAchieveCriteria.goalId', '=', 'criteriaGoal.id'),
                                )
                                .selectAll('GoalAchieveCriteria')
                                .select((eb) => [
                                    eb
                                        .case()
                                        .when('GoalAchieveCriteria.goalId', 'is not', null)
                                        .then(sql`"criteriaGoal"`)
                                        .else(null)
                                        .end()
                                        .as('criteriaGoal'),
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
                    historyWithMeta[index] = {
                        ...item,
                        // @ts-ignore
                        previousValue: prev || null,
                        // @ts-ignore
                        nextValue: next || null,
                    };
                } else {
                    historyWithMeta[index] = item;
                }
            }
        });
    }

    return historyWithMeta;
};
