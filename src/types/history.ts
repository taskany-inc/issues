import { Goal, State, Project, Tag, Activity, Estimate, GoalHistory, User, GoalAchieveCriteria } from '@prisma/client';

export const subjectToTableNameMap = {
    dependencies: true,
    project: true,
    tags: true,
    owner: true,
    participants: true,
    state: true,
    estimate: true,
    criteria: true,
};

export type HistoryRecordSubject = { [K in keyof typeof subjectToTableNameMap]: string };

export interface HistoryRecordMeta {
    dependencies: Goal & { state: State | null };
    project: Project;
    tags: Tag;
    owner: Activity & { user: User | null };
    participants: Activity & { user: User | null };
    estimate: Estimate;
    state: State;
    criteria: GoalAchieveCriteria & { goalAsCriteria: Goal & { state: State | null } };
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
          | HistoryValuesBySubject<'estimate'>
          | HistoryValuesBySubject<'participants'>
          | HistoryValuesBySubject<'project'>
          | HistoryValuesBySubject<'state'>
          | HistoryValuesBySubject<'owner'>
          | HistoryValuesBySubject<'criteria'>
          | {
                subject: 'title' | 'description';
                previousValue?: string;
                nextValue?: string;
            }
      ));

export type HistoryRecordWithActivity = HistoryRecord & { activity: Activity & { user: User | null } };
