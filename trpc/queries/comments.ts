import { db } from '../../src/utils/db/connection/kysely';
import { Comment as CommentDTO, Reaction as ReactionDTO, State } from '../../src/utils/db/generated/kysely/types';
import { ExtractTypeFromGenerated } from '../utils';

import { getUserActivity, Activity } from './activity';

interface CommentsByGoalIdQueryParams {
    goalId: string;
}

interface Comment extends ExtractTypeFromGenerated<CommentDTO> {
    activity: Activity;
    state: ExtractTypeFromGenerated<State>;
}

interface Reaction extends ExtractTypeFromGenerated<ReactionDTO> {
    activity: Activity;
}

export const commentsByGoalIdQuery = ({ goalId }: CommentsByGoalIdQueryParams) =>
    db
        .selectFrom('Comment')
        .innerJoinLateral(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('Comment.activityId', '=', 'activity.id'),
        )
        .leftJoin('State', 'State.id', 'Comment.stateId')
        .selectAll('Comment')
        .select(({ fn }) => [fn.toJson('State').as('state'), fn.toJson('activity').as('activity')])
        .where('Comment.goalId', '=', goalId)
        .orderBy('Comment.createdAt asc')
        .$castTo<Comment>();

export const lastStateUpdatedCommentQuery = ({ goalId }: CommentsByGoalIdQueryParams) =>
    commentsByGoalIdQuery({ goalId }).clearOrderBy().orderBy('Comment.createdAt desc').limit(1);

export const reactionsForGoalComments = ({ goalId }: CommentsByGoalIdQueryParams) =>
    db
        .selectFrom('Reaction')
        .selectAll('Reaction')
        .innerJoin(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('Reaction.activityId', '=', 'activity.id'),
        )
        .select(({ fn }) => fn.toJson('activity').as('activity'))
        .where('Reaction.commentId', 'in', ({ selectFrom }) =>
            selectFrom('Comment').select('Comment.id').where('Comment.goalId', '=', goalId),
        )
        .$castTo<Reaction>();
