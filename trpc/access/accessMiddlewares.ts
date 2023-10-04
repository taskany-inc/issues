import { TRPCError } from '@trpc/server';

import { middleware } from '../trpcBackend';

import { EntityAccessChecker, commentAccessChecker, projectAccessChecker, goalAccessChecker } from './accessCheckers';
import { getComment, getGoal, getGoalByCriteria, getProject } from './accessEntityGetters';

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
            throw new TRPCError({ code: accessErrorCode, message: 'Not authorized' });
        }

        const id = getId(input as TInput);
        const entity = await getEntity(id);

        if (!entity) {
            throw new TRPCError({ code: accessErrorCode, message: 'No entity to check access' });
        }

        const check = checker(session, entity);

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

export const criteriaAccessMiddleware = createEntityCheckMiddleware(
    (input: { id: string }) => input.id,
    getGoalByCriteria,
    goalAccessChecker,
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
