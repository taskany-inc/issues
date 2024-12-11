import { Goal } from '@prisma/client';

import { CommentEditSchema } from '../src/schema/comment';
import { GoalCommentCreateSchema, GoalCommon, GoalUpdate } from '../src/schema/goal';
import { ProjectCreate } from '../src/schema/project';
import {
    CommentCreateReturnType,
    GoalCreateReturnType,
    GoalUpdateReturnType,
    ProjectCreateReturnType,
} from '../trpc/inferredTypes';

import translations from './fixtures/langs.json';

export {};

export interface SignInFields {
    email: string;
    password: string;
}

interface TagData {
    activityId: string;
    createdAt: string;
    description?: string | null;
    id: string;
    title: string;
    updatedAt: string;
}

interface UserData {
    user: {
        name: string;
        email: string;
        image: string | null;
        id: string;
        role: 'ADMIN' | 'USER';
        nickname: string;
        activityId: string;
        settings: {
            id: string;
            theme: 'light' | 'dark';
            beta: boolean;
            flowId: string | null;
            createdAt: string;
            updatedAt: string;
        };
    };
    expires: string;
}
declare global {
    namespace Cypress {
        interface Chainable {
            logout(): Chainable<void>;
            signInViaEmail(fields?: SignInFields): Chainable<void>;
            interceptWhatsNew(): Chainable<void>;
            hideEmptyProjectOnGoalLists(): Chainable<void>;
            createProject(fields: ProjectCreate): Chainable<ProjectCreateReturnType>;
            createGoal(projectTitle: string, fields: GoalCommon): Chainable<GoalCreateReturnType>;
            createPersonalGoal(fields: GoalCommon): Chainable<GoalCreateReturnType>;
            updateGoal(shortId: string, filelds: GoalUpdate): Chainable<GoalUpdateReturnType>;
            deleteGoal(shortId: string): Chainable<void>;
            createComment(fields: GoalCommentCreateSchema): Chainable<CommentCreateReturnType>;
            updateComment(fields: CommentEditSchema): Chainable<CommentCreateReturnType>;
            deleteComment(id: string): Chainable<void>;
            task(
                event: 'db:create:project',
                data: { title: string; key: string; description?: string; ownerEmail: string; personal?: boolean },
            ): Chainable<string>;
            task(event: 'db:remove:project', data: { id: string }): Chainable<null>;
            task(
                event: 'db:create:user',
                data: { email: string; name?: string; password: string; provider: string },
            ): Chainable<UserData['user']>;
            task(event: 'db:remove:user', data: { id: string }): Chainable<null>;
            task(event: 'db:remove:user', data?: { ids: string[] }): Chainable<null>;
            task(
                event: 'db:create:goal',
                data: { title: string; projectId: string; ownerEmail: string; private?: boolean },
            ): Chainable<Goal>;
            task(event: 'db:create:tag', data: { title: string; userEmail: string }): Chainable<TagData>;
            task(event: 'db:remove:tag', data: { id: string }): Chainable<null>;
            task(event: 'db:remove:goal', data: { id: string }): Chainable<null>;
            task(event: 'db:watch:project', data: { projectId: string; userId: string }): Chainable<null>;
            task(event: 'db:watch:goal', data: { goalId: string; userId: string }): Chainable<null>;
            task(event: 'db:unwatch:project', data: { projectId: string; userId: string }): Chainable<null>;
            task(event: 'db:unwatch:goal', data: { goalId: string; userId: string }): Chainable<null>;
            task(event: 'db:participate:project', data: { projectId: string; userId: string }): Chainable<null>;
            task(event: 'db:participate:goal', data: { goalId: string; userId: string }): Chainable<null>;
            task(event: 'db:dropParticipate:project', data: { projectId: string; userId: string }): Chainable<null>;
            task(event: 'db:dropParticipate:goal', data: { goalId: string; userId: string }): Chainable<null>;
            interceptEditor(): Chainable<void>;
            waitEditor(): Chainable<void>;
            loadLangFile(): Chainable<void>;
            getErrorTooltip(errorMessage: string): Chainable<JQuery<HTMLElement>>;
            getTippy(errorMessage: string): Chainable<JQuery<HTMLElement>>;
            getMultipleFields<T extends string>(selector: T[]): Chainable<Record<keyof T, string>>;
        }
        interface Cypress {
            env(): {
                currentUser: UserData;
                ADMIN_EMAIL: string;
                ADMIN_PASSWORD: string;
                defaultPriority: 'Medium';
                stubProject?: string;
                createdGoal?: GoalCreateReturnType;
                testUser: UserData['user'];
                createdComment: CommentCreateReturnType;
                translations: typeof translations;
            };
            env(key: 'currentUser'): UserData;
            env(key: 'currentUser', value: UserData): void;
            env(key: 'ADMIN_EMAIL'): string;
            env(key: 'ADMIN_EMAIL', value: string): void;
            env(key: 'ADMIN_PASSWORD'): string;
            env(key: 'ADMIN_PASSWORD', value: string): void;
            env(key: 'defaultPriority'): 'Medium';
            env(key: 'stubProject'): string;
            env(key: 'stubProject', value: string): void;
            env(key: 'createdGoal', value: GoalCreateReturnType): void;
            env(key: 'createdGoal'): GoalCreateReturnType;
            env(key: 'createdComment'): CommentCreateReturnType;
            env(key: 'testUser', value: UserData['user']): void;
            env(key: 'testUser'): UserData['user'];
            env(key: 'translations'): typeof translations;
            env(key: 'translations', value: typeof translations): void;
        }
    }
}
