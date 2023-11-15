import {
    Goal,
    State,
    Project,
    Tag,
    Activity,
    GoalHistory,
    User,
    GoalAchieveCriteria,
    Ghost,
    Priority,
} from '@prisma/client';

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

export type HistoryRecordSubject = { [K in keyof typeof subjectToTableNameMap]: string };

export interface HistoryRecordMeta {
    dependencies: Goal & { state: State | null };
    project: Project;
    tags: Tag;
    owner: Activity & { user: User | null; ghost: Ghost | null };
    participants: Activity & { user: User | null; ghost: Ghost | null };
    state: State;
    criteria: GoalAchieveCriteria & { criteriaGoal: Goal & { state: State | null } };
    partnerProject: Project;
    priority: Priority;
}

export type HistoryAction = 'add' | 'change' | 'remove' | 'delete' | 'edit' | 'complete' | 'uncomplete';

type HistoryValuesBySubject<T extends keyof HistoryRecordSubject, V = HistoryRecordMeta[T]> = {
    subject: T;
    previousValue?: V;
    nextValue?: V;
};

type HistoryRecord =
    | GoalHistory
    | ({
          id: string;
          action: HistoryAction;
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
          | {
                subject: 'title' | 'description' | 'estimate';
                previousValue?: string;
                nextValue?: string;
            }
          | HistoryValuesBySubject<'partnerProject'>
      ));

export type HistoryRecordWithActivity = HistoryRecord & { activity: Activity & { user: User | null } };
