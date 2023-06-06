import { Goal, State, Project, Tag, Activity, Estimate, GoalHistory, User } from '@prisma/client';

export const subjectToTableNameMap = {
    dependencies: true,
    project: true,
    tags: true,
    owner: true,
    participants: true,
    state: true,
    estimate: true,
} as const;

export type Subject = { [K in keyof typeof subjectToTableNameMap]: string };

export interface Meta {
    dependencies: Goal & { state: State | null };
    project: Project;
    tags: Tag;
    owner: Activity & { user: User | null };
    participants: Activity & { user: User | null };
    estimate: Estimate;
    state: State;
}

export type HistoryAction = 'add' | 'change' | 'remove' | 'delete' | 'edit';

type HistoryValuesBySubject<T extends keyof Subject, V = Meta[T]> = {
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
          | HistoryValuesBySubject<'dependencies', Meta['dependencies'][]>
          | HistoryValuesBySubject<'tags', Meta['tags'][]>
          | HistoryValuesBySubject<'estimate'>
          | HistoryValuesBySubject<'participants'>
          | HistoryValuesBySubject<'project'>
          | HistoryValuesBySubject<'state'>
          | HistoryValuesBySubject<'owner'>
          | {
                subject: 'title' | 'description';
                previousValue?: string;
                nextValue?: string;
            }
      ));

export type HistoryRecordWithActivity = HistoryRecord & { activity: Activity & { user: User | null } };
