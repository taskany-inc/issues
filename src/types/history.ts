import { Goal, State, Project, Tag, Activity, User, GoalAchieveCriteria, Ghost, Priority } from '@prisma/client';

import { addCommonCalculatedGoalFields } from '../utils/db/calculatedGoalsFields';

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
export type HistoryRecordAction = 'add' | 'change' | 'remove' | 'delete' | 'edit' | 'complete' | 'uncomplete';

export interface HistoryRecordMeta {
    dependencies: Goal & { state: State | null } & ReturnType<typeof addCommonCalculatedGoalFields>;
    project: Project;
    tags: Tag;
    owner: Activity & { user: User | null; ghost: Ghost | null };
    participants: Activity & { user: User | null; ghost: Ghost | null };
    state: State;
    criteria: GoalAchieveCriteria & { criteriaGoal: Goal & { state: State | null } };
    partnerProject: Project;
    priority: Priority;
    title: string;
    description: string;
    estimate: string;
}

type HistoryValuesBySubject<T extends keyof HistoryRecordSubject, V = HistoryRecordMeta[T]> = {
    subject: T;
    previousValue?: V;
    nextValue?: V;
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
          | HistoryValuesBySubject<'state'>
          | HistoryValuesBySubject<'owner'>
          | HistoryValuesBySubject<'criteria'>
          | HistoryValuesBySubject<'priority'>
          | HistoryValuesBySubject<'title' | 'description' | 'estimate', string | null>
          | HistoryValuesBySubject<'partnerProject'>
      );

export type HistoryRecordWithActivity = HistoryRecord & { activity: Activity & { user: User | null } };

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
