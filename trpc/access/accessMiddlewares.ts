import { TRPCError } from '@trpc/server';

import { middleware } from '../trpcBackend';

import {
    EntityAccessChecker,
    commentAccessChecker,
    projectEditAccessChecker,
    goalEditAccessChecker,
    projectAccessChecker,
    goalAccessChecker,
    goalParticipantEditAccessChecker,
} from './accessCheckers';
import { getComment, getGoal, getGoalByCriteria, getGoalByShortId, getProject } from './accessEntityGetters';
import { tr } from './access.i18n';

const accessErrorCode = 'FORBIDDEN';

type EntityIdGetter<TInput, TId> = (input: TInput) => TId;
type EntityGetter<TId, TEntity> = (id: TId) => TEntity | Promise<TEntity>;

const createEntityCheckMiddleware = <TInput, TId, TEntity>(
    getId: EntityIdGetter<TInput, TId>,
    getEntity: EntityGetter<TId, TEntity | null>,
    checker: EntityAccessChecker<NonNullable<TEntity>>,
) =>
    middleware(async ({ next, ctx, input }) => {
        const { session } = ctx;

        if (!session) {
            throw new TRPCError({ code: accessErrorCode, message: tr('Not authorized') });
        }

        const id = getId(input as TInput);
        const entity = await getEntity(id);

        if (!entity) {
            throw new TRPCError({ code: accessErrorCode, message: tr('No entity to check access') });
        }

        const check = await checker(session, entity);

        if (!check.allowed) {
            throw new TRPCError({ code: accessErrorCode, message: check.errorMessage });
        }

        return next({ ctx: { session, headers: ctx.headers } });
    });

export const goalAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string; goalId: string }) => input.id ?? input.goalId,
    getGoal,
    goalAccessChecker,
);

export const goalByShortIdAccessMiddleware = createEntityCheckMiddleware(
    (input: string) => input,
    getGoalByShortId,
    goalAccessChecker,
);

export const goalEditAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string; goalId: string }) => input.id ?? input.goalId,
    getGoal,
    goalEditAccessChecker,
);

export const goalParticipantEditAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string; goalId: string }) => input.id ?? input.goalId,
    getGoal,
    goalParticipantEditAccessChecker,
);

export const criteriaAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string }) => input.id,
    getGoalByCriteria,
    goalEditAccessChecker,
);

export const commentAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string }) => input.id,
    getComment,
    commentAccessChecker,
);

export const projectAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string }) => input.id,
    getProject,
    projectAccessChecker,
);

export const projectEditAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string }) => input.id,
    getProject,
    projectEditAccessChecker,
);
